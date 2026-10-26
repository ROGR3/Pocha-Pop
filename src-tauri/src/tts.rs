// Poslech: text-to-speech. On Android the Kotlin plugin
// (gen/android/app/src/main/java/cz/rogr/pochapop/TtsPlugin.kt) speaks with the
// system TextToSpeech; every finished utterance becomes the app event
// `tts://done {id}`. On desktop there is no voice: `tts_status` says so and
// the game greys out Poslech.
use serde::{Deserialize, Serialize};
use tauri::{
  plugin::{Builder, TauriPlugin},
  Wry,
};

#[derive(Serialize, Deserialize, Clone, Copy, Default)]
pub struct TtsStatus {
  pub available: bool,
  pub korean: bool,
}

#[cfg(target_os = "android")]
mod imp {
  use super::TtsStatus;
  use serde::{Deserialize, Serialize};
  use std::sync::atomic::{AtomicBool, Ordering};
  use tauri::{ipc::Channel, plugin::PluginHandle, AppHandle, Emitter, Manager, Wry};

  pub struct Tts {
    handle: PluginHandle<Wry>,
    /// `tts://done` forwarding is set up on the first command (not in setup: no blocking there).
    hooked: AtomicBool,
  }

  #[derive(Serialize, Deserialize, Clone)]
  struct Done {
    id: String,
    #[serde(default)]
    error: bool,
  }

  #[derive(Serialize)]
  struct HandlerArgs {
    handler: Channel<serde_json::Value>,
  }

  pub fn register(app: &AppHandle<Wry>, api: tauri::plugin::PluginApi<Wry, ()>) {
    match api.register_android_plugin("cz.rogr.pochapop", "TtsPlugin") {
      Ok(handle) => {
        app.manage(Tts { handle, hooked: AtomicBool::new(false) });
      }
      Err(e) => log::warn!("tts plugin: {e}"),
    }
  }

  async fn get(app: &AppHandle<Wry>) -> Option<tauri::State<'_, Tts>> {
    let t = app.try_state::<Tts>()?;
    if !t.hooked.swap(true, Ordering::SeqCst) {
      let emitter = app.clone();
      let handler = Channel::new(move |body| {
        if let tauri::ipc::InvokeResponseBody::Json(json) = body {
          if let Ok(d) = serde_json::from_str::<Done>(&json) {
            let _ = emitter.emit("tts://done", d);
          }
        }
        Ok(())
      });
      if let Err(e) = t.handle.run_mobile_plugin_async::<serde_json::Value>("setEventHandler", HandlerArgs { handler }).await {
        log::warn!("tts handler: {e}");
        t.hooked.store(false, Ordering::SeqCst);
      }
    }
    Some(t)
  }

  pub async fn status(app: &AppHandle<Wry>) -> TtsStatus {
    match get(app).await {
      Some(t) => t.handle.run_mobile_plugin_async("status", ()).await.unwrap_or_default(),
      None => TtsStatus::default(),
    }
  }

  pub async fn call(app: &AppHandle<Wry>, cmd: &str, args: serde_json::Value) -> Result<(), String> {
    let t = get(app).await.ok_or("tts unavailable")?;
    t.handle.run_mobile_plugin_async::<serde_json::Value>(cmd, args).await.map(|_| ()).map_err(|e| e.to_string())
  }
}

pub fn init() -> TauriPlugin<Wry> {
  Builder::new("tts")
    .setup(|_app, _api| {
      #[cfg(target_os = "android")]
      imp::register(_app, _api);
      Ok(())
    })
    .build()
}

#[tauri::command]
pub async fn tts_status(app: tauri::AppHandle<Wry>) -> TtsStatus {
  #[cfg(target_os = "android")]
  return imp::status(&app).await;
  #[cfg(not(target_os = "android"))]
  {
    let _ = app;
    TtsStatus::default()
  }
}

#[tauri::command]
pub async fn tts_speak(app: tauri::AppHandle<Wry>, text: String, rate: f32, volume: f32, id: String) -> Result<(), String> {
  #[cfg(target_os = "android")]
  return imp::call(&app, "speak", serde_json::json!({ "text": text, "rate": rate, "volume": volume, "id": id })).await;
  #[cfg(not(target_os = "android"))]
  {
    let _ = (app, text, rate, volume, id);
    Err("tts unavailable".into())
  }
}

#[tauri::command]
pub async fn tts_stop(app: tauri::AppHandle<Wry>) -> Result<(), String> {
  #[cfg(target_os = "android")]
  return imp::call(&app, "stop", serde_json::json!({})).await;
  #[cfg(not(target_os = "android"))]
  {
    let _ = app;
    Ok(())
  }
}

#[tauri::command]
pub async fn tts_install_data(app: tauri::AppHandle<Wry>) -> Result<(), String> {
  #[cfg(target_os = "android")]
  return imp::call(&app, "installData", serde_json::json!({})).await;
  #[cfg(not(target_os = "android"))]
  {
    let _ = app;
    Err("tts unavailable".into())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn desktop_reports_no_voice() {
    let s = TtsStatus::default();
    assert!(!s.available && !s.korean);
    assert_eq!(serde_json::to_string(&s).unwrap(), r#"{"available":false,"korean":false}"#);
  }
}

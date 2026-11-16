// Co-op: the Android 17 local-network permission. The Kotlin plugin
// (gen/android/app/src/main/java/cz/rogr/pochapop/NetPlugin.kt) asks for
// ACCESS_LOCAL_NETWORK; without it the system silently drops every packet
// between the phones. Desktop needs nothing.
use tauri::{
  plugin::{Builder, TauriPlugin},
  Wry,
};

#[cfg(target_os = "android")]
mod imp {
  use serde::Deserialize;
  use tauri::{plugin::PluginHandle, AppHandle, Manager, Wry};

  pub struct LocalNet(PluginHandle<Wry>);

  #[derive(Deserialize)]
  struct Granted {
    granted: bool,
  }

  pub fn register(app: &AppHandle<Wry>, api: tauri::plugin::PluginApi<Wry, ()>) {
    match api.register_android_plugin("cz.rogr.pochapop", "NetPlugin") {
      Ok(handle) => {
        app.manage(LocalNet(handle));
      }
      Err(e) => log::warn!("net plugin: {e}"),
    }
  }

  pub async fn permission(app: &AppHandle<Wry>) -> bool {
    let Some(p) = app.try_state::<LocalNet>() else { return true };
    match p.0.run_mobile_plugin_async::<Granted>("localNetwork", ()).await {
      Ok(g) => g.granted,
      Err(e) => {
        log::warn!("local network permission: {e}");
        true
      }
    }
  }
}

pub fn init() -> TauriPlugin<Wry> {
  Builder::new("localnet")
    .setup(|_app, _api| {
      #[cfg(target_os = "android")]
      imp::register(_app, _api);
      Ok(())
    })
    .build()
}

/// true = the game may talk to other phones (always on desktop).
#[tauri::command]
pub async fn net_permission(app: tauri::AppHandle<Wry>) -> bool {
  #[cfg(target_os = "android")]
  return imp::permission(&app).await;
  #[cfg(not(target_os = "android"))]
  {
    let _ = app;
    true
  }
}

mod net;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default();
  #[cfg(mobile)]
  let builder = builder.plugin(tauri_plugin_barcode_scanner::init());
  builder
    .plugin(tauri_plugin_store::Builder::default().build())
    .manage(net::NetState::default())
    .invoke_handler(tauri::generate_handler![
      net::net_host_start,
      net::net_host_stop,
      net::net_join,
      net::net_send,
      net::net_kick,
      net::net_leave,
      net::net_local_ips
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

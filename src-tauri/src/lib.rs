mod http;

use http::Requests;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Auto-update (assinado) apenas no desktop; a chave pública fica em tauri.conf.json.
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            let _ = app;
            Ok(())
        })
        .manage(Requests::default())
        .invoke_handler(tauri::generate_handler![http::make_request, http::cancel_request])
        .run(tauri::generate_context!())
        .expect("error while running PingHermano");
}

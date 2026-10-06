mod http;

use http::Requests;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Requests::default())
        .invoke_handler(tauri::generate_handler![http::make_request, http::cancel_request])
        .run(tauri::generate_context!())
        .expect("error while running Post Hermano");
}

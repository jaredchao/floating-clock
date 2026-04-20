mod window;
mod tray;
pub mod alarm;
pub mod store;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let store = store::init_store(app.handle());
            app.manage(store::StoreState(Mutex::new(store)));
            let _window = window::setup_window(app.handle());
            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            store::get_alarms,
            store::save_alarms,
            store::get_setting,
            store::set_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

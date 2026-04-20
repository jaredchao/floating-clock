use tauri::{AppHandle, Manager, WebviewWindow};

pub fn setup_window(app: &AppHandle) -> WebviewWindow {
    let window = app.get_webview_window("main").expect("main window not found");
    window
}

use serde_json::Value;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, State, Wry};
use tauri_plugin_store::Store;

const ALARMS_KEY: &str = "alarms";

pub struct StoreState(pub Mutex<Arc<Store<Wry>>>);

pub fn init_store(app: &AppHandle) -> Arc<Store<Wry>> {
    let store = tauri_plugin_store::StoreBuilder::new(app, "settings.dat")
        .build()
        .expect("failed to build store");
    store
}

#[tauri::command]
pub fn get_alarms(state: State<StoreState>) -> Result<Vec<crate::alarm::Alarm>, String> {
    let store = state.0.lock().map_err(|e| e.to_string())?;
    match store.get(ALARMS_KEY) {
        Some(value) => serde_json::from_value(value.clone()).map_err(|e| e.to_string()),
        None => Ok(Vec::new()),
    }
}

#[tauri::command]
pub fn save_alarms(
    alarms: Vec<crate::alarm::Alarm>,
    state: State<StoreState>,
    alarm_state: State<crate::alarm::AlarmState>,
) -> Result<(), String> {
    let store = state.0.lock().map_err(|e| e.to_string())?;
    let value = serde_json::to_value(&alarms).map_err(|e| e.to_string())?;
    store.set(ALARMS_KEY, value);
    store.save().map_err(|e| e.to_string())?;
    drop(store);

    let mut mem_alarms = alarm_state.alarms.lock().map_err(|e| e.to_string())?;
    *mem_alarms = alarms;

    Ok(())
}

#[tauri::command]
pub fn get_setting(key: String, state: State<StoreState>) -> Result<Option<Value>, String> {
    let store = state.0.lock().map_err(|e| e.to_string())?;
    Ok(store.get(&key).map(|v| v.clone()))
}

#[tauri::command]
pub fn set_setting(key: String, value: Value, state: State<StoreState>) -> Result<(), String> {
    let store = state.0.lock().map_err(|e| e.to_string())?;
    store.set(key, value);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

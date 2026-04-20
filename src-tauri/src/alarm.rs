use chrono::Timelike;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Alarm {
    pub id: String,
    pub hour: u8,
    pub minute: u8,
    pub label: String,
    pub enabled: bool,
}

impl Alarm {
    pub fn new(hour: u8, minute: u8, label: String) -> Self {
        Self {
            id: format!("alarm_{}_{}_{}", hour, minute, rand::random::<u16>()),
            hour,
            minute,
            label,
            enabled: true,
        }
    }

    pub fn should_trigger(&self) -> bool {
        if !self.enabled {
            return false;
        }
        let now = chrono::Local::now();
        now.hour() as u8 == self.hour
            && now.minute() as u8 == self.minute
            && now.second() == 0
    }
}

pub struct AlarmState {
    pub alarms: Arc<Mutex<Vec<Alarm>>>,
}

pub fn start_alarm_scheduler(app: AppHandle) {
    std::thread::spawn(move || {
        let mut last_triggered_minute: Option<(u32, u32)> = None;

        loop {
            let now = chrono::Local::now();
            let current_minute = (now.hour(), now.minute());

            if now.second() == 0 && last_triggered_minute != Some(current_minute) {
                if let Some(state) = app.try_state::<AlarmState>() {
                    let alarms = state.alarms.lock().unwrap();

                    for alarm in alarms.iter() {
                        if alarm.enabled
                            && alarm.hour as u32 == now.hour()
                            && alarm.minute as u32 == now.minute()
                        {
                            let _ = app.emit("alarm-triggered", alarm.clone());
                        }
                    }
                }
                last_triggered_minute = Some(current_minute);
            }

            std::thread::sleep(std::time::Duration::from_secs(1));
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_alarm_creation() {
        let alarm = Alarm::new(8, 30, "起床".to_string());
        assert_eq!(alarm.hour, 8);
        assert_eq!(alarm.minute, 30);
        assert_eq!(alarm.label, "起床");
        assert!(alarm.enabled);
    }

    #[test]
    fn test_disabled_alarm_never_triggers() {
        let mut alarm = Alarm::new(0, 0, "test".to_string());
        alarm.enabled = false;
        assert!(!alarm.should_trigger());
    }
}

use chrono::Timelike;
use serde::{Deserialize, Serialize};

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

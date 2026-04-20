import { invoke } from "@tauri-apps/api/core";

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
}

const MAX_ALARMS = 3;

export async function getAlarms(): Promise<Alarm[]> {
  return invoke("get_alarms");
}

export async function saveAlarms(alarms: Alarm[]): Promise<void> {
  return invoke("save_alarms", { alarms });
}

export async function addAlarm(hour: number, minute: number, label: string): Promise<Alarm | null> {
  const alarms = await getAlarms();
  if (alarms.length >= MAX_ALARMS) {
    return null;
  }

  const newAlarm: Alarm = {
    id: `alarm_${hour}_${minute}_${Date.now()}`,
    hour,
    minute,
    label,
    enabled: true,
  };

  alarms.push(newAlarm);
  await saveAlarms(alarms);
  return newAlarm;
}

export async function deleteAlarm(id: string): Promise<void> {
  const alarms = await getAlarms();
  const filtered = alarms.filter((a) => a.id !== id);
  await saveAlarms(filtered);
}

export async function toggleAlarm(id: string): Promise<void> {
  const alarms = await getAlarms();
  const alarm = alarms.find((a) => a.id === id);
  if (alarm) {
    alarm.enabled = !alarm.enabled;
    await saveAlarms(alarms);
  }
}

export function formatAlarmTime(alarm: Alarm): string {
  const h = alarm.hour.toString().padStart(2, "0");
  const m = alarm.minute.toString().padStart(2, "0");
  return `${h}:${m}`;
}

import { invoke } from "@tauri-apps/api/core";

const SETTINGS_KEY = "clock_settings";

export interface ClockSettings {
  is24Hour: boolean;
  autoStart: boolean;
}

export async function getSettings(): Promise<ClockSettings> {
  try {
    const value = await invoke<Record<string, unknown> | null>("get_setting", { key: SETTINGS_KEY });
    if (value) {
      return {
        is24Hour: (value.is24Hour as boolean) ?? true,
        autoStart: (value.autoStart as boolean) ?? false,
      };
    }
  } catch {
    // ignore
  }
  return { is24Hour: true, autoStart: false };
}

export async function saveSettings(settings: ClockSettings): Promise<void> {
  await invoke("set_setting", { key: SETTINGS_KEY, value: settings });
}

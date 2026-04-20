const SETTINGS_KEY = "clock-settings";

export function formatTime(date: Date, is24Hour: boolean): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const minsStr = minutes.toString().padStart(2, "0");
  const secsStr = seconds.toString().padStart(2, "0");

  if (is24Hour) {
    const hrsStr = hours.toString().padStart(2, "0");
    return `${hrsStr}:${minsStr}:${secsStr}`;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const hrs12 = hours % 12 || 12;
  const hrsStr = hrs12.toString().padStart(2, "0");
  return `${hrsStr}:${minsStr}:${secsStr} ${period}`;
}

export function is24HourFormat(): boolean {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.is24Hour ?? true;
    }
  } catch {
    // ignore parse errors
  }
  return true;
}

export function set24HourFormat(value: boolean): void {
  const settings = { is24Hour: value };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function startClock(updateCallback: (timeStr: string) => void): () => void {
  const tick = () => {
    const now = new Date();
    const is24Hour = is24HourFormat();
    updateCallback(formatTime(now, is24Hour));
  };

  tick();
  const interval = setInterval(tick, 1000);

  const onSettingsChange = () => tick();
  window.addEventListener("settings-changed", onSettingsChange);

  return () => {
    clearInterval(interval);
    window.removeEventListener("settings-changed", onSettingsChange);
  };
}

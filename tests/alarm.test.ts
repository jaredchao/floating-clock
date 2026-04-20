import { describe, it, expect } from "vitest";
import {
  formatAlarmTime,
  type Alarm,
} from "../src/alarm";

describe("formatAlarmTime", () => {
  it("formats alarm time with padding", () => {
    const alarm: Alarm = { id: "1", hour: 8, minute: 5, label: "test", enabled: true };
    expect(formatAlarmTime(alarm)).toBe("08:05");
  });

  it("formats midnight correctly", () => {
    const alarm: Alarm = { id: "1", hour: 0, minute: 0, label: "test", enabled: true };
    expect(formatAlarmTime(alarm)).toBe("00:00");
  });

  it("formats noon correctly", () => {
    const alarm: Alarm = { id: "1", hour: 12, minute: 30, label: "test", enabled: true };
    expect(formatAlarmTime(alarm)).toBe("12:30");
  });
});

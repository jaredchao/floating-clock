import { describe, it, expect } from "vitest";
import { formatTime, is24HourFormat } from "../src/clock";

describe("formatTime", () => {
  it("formats time in 24h mode", () => {
    const date = new Date(2024, 0, 1, 14, 30, 0);
    expect(formatTime(date, true)).toBe("14:30");
  });

  it("formats time in 12h mode (PM)", () => {
    const date = new Date(2024, 0, 1, 14, 30, 0);
    expect(formatTime(date, false)).toBe("02:30 PM");
  });

  it("formats time in 12h mode (AM)", () => {
    const date = new Date(2024, 0, 1, 9, 5, 0);
    expect(formatTime(date, false)).toBe("09:05 AM");
  });

  it("pads single digit minutes", () => {
    const date = new Date(2024, 0, 1, 9, 5, 0);
    expect(formatTime(date, true)).toBe("09:05");
  });
});

describe("is24HourFormat", () => {
  it("returns default value when no setting stored", () => {
    expect(is24HourFormat()).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { formatTime, is24HourFormat } from "../src/clock";

describe("formatTime", () => {
  it("formats time in 24h mode with seconds", () => {
    const date = new Date(2024, 0, 1, 14, 30, 55);
    expect(formatTime(date, true)).toBe("14:30:55");
  });

  it("formats time in 12h mode (PM) with seconds", () => {
    const date = new Date(2024, 0, 1, 14, 30, 55);
    expect(formatTime(date, false)).toBe("02:30:55 PM");
  });

  it("formats time in 12h mode (AM) with seconds", () => {
    const date = new Date(2024, 0, 1, 9, 5, 8);
    expect(formatTime(date, false)).toBe("09:05:08 AM");
  });

  it("pads single digit values", () => {
    const date = new Date(2024, 0, 1, 9, 5, 8);
    expect(formatTime(date, true)).toBe("09:05:08");
  });
});

describe("is24HourFormat", () => {
  it("returns default value when no setting stored", () => {
    expect(is24HourFormat()).toBe(true);
  });
});

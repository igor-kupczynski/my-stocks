import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { startRefresher } from "../../utils/refresher";

describe("startRefresher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls callback immediately on start", () => {
    let count = 0;
    const dispose = startRefresher(() => {
      count++;
    }, 60_000);
    expect(count).toBe(1);
    dispose();
  });

  it("calls callback periodically and stops after dispose", () => {
    let count = 0;
    const dispose = startRefresher(() => {
      count++;
    }, 1_000);

    expect(count).toBe(1); // immediate

    vi.advanceTimersByTime(1_000);
    expect(count).toBe(2);

    vi.advanceTimersByTime(2_000);
    expect(count).toBe(4);

    dispose();

    vi.advanceTimersByTime(5_000);
    expect(count).toBe(4); // no further calls after dispose
  });
});

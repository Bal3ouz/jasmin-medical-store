import { describe, expect, test } from "bun:test";
import { parsePeriod, periodToInterval } from "./period";

describe("parsePeriod", () => {
  test("returns 30d for unknown / undefined input", () => {
    expect(parsePeriod(undefined)).toBe("30d");
    expect(parsePeriod("foo")).toBe("30d");
    expect(parsePeriod("")).toBe("30d");
  });
  test("returns the input when it's a valid period token", () => {
    expect(parsePeriod("7d")).toBe("7d");
    expect(parsePeriod("30d")).toBe("30d");
    expect(parsePeriod("90d")).toBe("90d");
    expect(parsePeriod("12m")).toBe("12m");
    expect(parsePeriod("all")).toBe("all");
  });
});

describe("periodToInterval", () => {
  const NOW = new Date("2026-04-29T12:00:00Z");

  test("7d → granularity day, since=now-7d", () => {
    const i = periodToInterval("7d", NOW);
    expect(i.granularity).toBe("day");
    expect(i.since!.toISOString()).toBe("2026-04-22T12:00:00.000Z");
    expect(i.until.toISOString()).toBe(NOW.toISOString());
  });
  test("30d → granularity day", () => {
    expect(periodToInterval("30d", NOW).granularity).toBe("day");
  });
  test("90d → granularity week", () => {
    expect(periodToInterval("90d", NOW).granularity).toBe("week");
  });
  test("12m → granularity month, since one year before now", () => {
    const i = periodToInterval("12m", NOW);
    expect(i.granularity).toBe("month");
    expect(i.since!.toISOString()).toBe("2025-04-29T12:00:00.000Z");
  });
  test("all → since=null, granularity month", () => {
    const i = periodToInterval("all", NOW);
    expect(i.since).toBeNull();
    expect(i.granularity).toBe("month");
  });
});

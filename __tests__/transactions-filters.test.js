import {
  getDateRangeError,
  normalizeServices,
} from "@/features/transactions/filters";

describe("getDateRangeError", () => {
  test("requires both dates", () => {
    expect(getDateRangeError("", "")).toBe("Choose a start and end date.");
    expect(getDateRangeError("2026-01-01", "")).toBe(
      "Choose a start and end date.",
    );
  });

  test("rejects invalid and reversed dates", () => {
    expect(getDateRangeError("2026-02-30", "2026-03-01")).toBe(
      "Enter valid dates.",
    );
    expect(getDateRangeError("2026-03-02", "2026-03-01")).toBe(
      "End date must be on or after the start date.",
    );
  });

  test("allows up to 90 inclusive calendar days and rejects longer ranges", () => {
    expect(getDateRangeError("2026-01-01", "2026-03-31")).toBeNull();
    expect(getDateRangeError("2026-01-01", "2026-04-01")).toBe(
      "Select a range of 90 days or fewer.",
    );
  });
});

describe("normalizeServices", () => {
  test("deduplicates and sorts supported services and ignores unsupported values", () => {
    expect(normalizeServices(["sms", "airtime", "sms", "unknown"])).toEqual([
      "airtime",
      "sms",
    ]);
  });

  test("returns an empty list to represent all services", () => {
    expect(normalizeServices([])).toEqual([]);
  });
});

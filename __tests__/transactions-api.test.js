import { apiFetch, ApiError } from "@/services/api";
import {
  buildTransactionParams,
  fetchTransactions,
} from "@/services/transactions";

const payload = {
  status: "success",
  date_from: "2026-07-01",
  date_to: "2026-07-31",
  type: ["airtime"],
  transactions: [],
  pagination: { limit: 50, next_cursor: null },
};

const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

afterEach(() => {
  jest.restoreAllMocks();
  process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
});

describe("transaction request construction", () => {
  test("omits the service filter when all services are requested", () => {
    expect(
      buildTransactionParams({
        dateFrom: "2026-07-01",
        dateTo: "2026-07-31",
        services: [],
      }),
    ).toEqual({
      date_from: "2026-07-01",
      date_to: "2026-07-31",
      limit: 50,
    });
  });

  test("serializes the same normalized filters with the opaque cursor", () => {
    expect(
      buildTransactionParams({
        dateFrom: "2026-07-01",
        dateTo: "2026-07-31",
        services: ["sms", "airtime"],
        cursor: "opaque/cursor+value",
      }),
    ).toEqual({
      date_from: "2026-07-01",
      date_to: "2026-07-31",
      type: "airtime,sms",
      limit: 50,
      cursor: "opaque/cursor+value",
    });
  });

  test("serializes multiple services using the transactions endpoint parameters", () => {
    expect(
      buildTransactionParams({
        dateFrom: "2026-07-01",
        dateTo: "2026-07-31",
        services: ["data", "airtime"],
      }),
    ).toEqual({
      date_from: "2026-07-01",
      date_to: "2026-07-31",
      type: "airtime,data",
      limit: 50,
    });
  });

  test("calls the versioned transactions route using the shared fetch wrapper", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api/v1";
    const signal = new AbortController().signal;
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    await fetchTransactions(
      { dateFrom: "2026-07-01", dateTo: "2026-07-31", services: [] },
      { signal },
    );

    const [url, options] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe(
      "https://api.example.test/api/v1/transactions?date_from=2026-07-01&date_to=2026-07-31&limit=50",
    );
    expect(options.signal).toBe(signal);
  });
});

describe("apiFetch", () => {
  test("uses the configured API base, includes the current session, and forwards cancellation", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api/v1";
    const controller = new AbortController();
    const response = { ok: true, status: 200, json: async () => payload };
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(response);

    await apiFetch("transactions", {
      query: { date_from: "2026-07-01" },
      signal: controller.signal,
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe(
      "https://api.example.test/api/v1/transactions?date_from=2026-07-01",
    );
    expect(options.credentials).toBe("include");
    expect(options.signal).toBe(controller.signal);
    expect(options.headers.Accept).toBe("application/json");
  });

  test.each([
    [401, "UNAUTHENTICATED"],
    [403, "SIMCLOUD_ACCESS_DENIED"],
    [500, "UPSTREAM_ERROR"],
  ])("normalizes HTTP %s without displaying provider details", async (status, code) => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api/v1";
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status,
      json: async () => ({
        error: {
          code,
          message: "safe message",
        },
      }),
    });

    await expect(apiFetch("transactions")).rejects.toMatchObject({
      name: "ApiError",
      status,
      code,
      message:
        status === 500
          ? "The transaction service is temporarily unavailable. Please try again."
          : "safe message",
    });
  });

  test("does not turn an aborted request into a service error", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api/v1";
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    jest.spyOn(global, "fetch").mockRejectedValue(abortError);

    await expect(apiFetch("transactions")).rejects.toBe(abortError);
  });

  test("uses the configured transactions API endpoint when no override is set", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    await apiFetch("transactions", {
      query: {
        date_from: "2026-07-01",
        date_to: "2026-07-31",
        type: "airtime,data",
        limit: 50,
      },
    });

    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      "https://e-tarrif-be.onrender.com/api/transactions?date_from=2026-07-01&date_to=2026-07-31&type=airtime%2Cdata&limit=50",
    );
  });
});

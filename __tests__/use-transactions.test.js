import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  getUniqueTransactions,
  useTransactions,
} from "@/features/transactions/hooks/useTransactions";

const FILTERS = {
  dateFrom: "2026-07-01",
  dateTo: "2026-07-31",
  services: ["airtime"],
};

const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

function transaction(id) {
  return {
    id,
    service: "airtime",
    status: "success",
    reason: null,
    reference: id,
    created_at: "2026-07-29 09:31:20",
    updated_at: "2026-07-29 09:31:48",
  };
}

function page(ids, nextCursor = null) {
  return {
    status: "success",
    date_from: FILTERS.dateFrom,
    date_to: FILTERS.dateTo,
    type: ["airtime"],
    transactions: ids.map(transaction),
    pagination: { limit: 50, next_cursor: nextCursor },
  };
}

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  });
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useTransactions", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api/v1";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
  });

  test("uses the returned cursor with unchanged filters and appends pages once", async () => {
    const requests = [];
    jest.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = new URL(input);
      requests.push(url);
      return jsonResponse(
        url.searchParams.has("cursor")
          ? page(["airtime:2"])
          : page(["airtime:1", "airtime:2"], "opaque/cursor+value"),
      );
    });

    const { result } = renderHook(
      () => useTransactions(FILTERS, "user-1"),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data.pages).toHaveLength(2);
    expect(
      getUniqueTransactions(result.current.data.pages).map((item) => item.id),
    ).toEqual(["airtime:1", "airtime:2"]);
    expect(requests).toHaveLength(2);
    expect(requests[1].searchParams.get("date_from")).toBe(FILTERS.dateFrom);
    expect(requests[1].searchParams.get("date_to")).toBe(FILTERS.dateTo);
    expect(requests[1].searchParams.get("type")).toBe("airtime");
    expect(requests[1].searchParams.get("cursor")).toBe(
      "opaque/cursor+value",
    );
  });

  test("starts a fresh first page when applied filters change", async () => {
    const requests = [];
    jest.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = new URL(input);
      requests.push(url);
      return jsonResponse(
        page(
          [url.searchParams.get("type")],
          url.searchParams.has("cursor") ? null : "next-cursor",
        ),
      );
    });

    const { result, rerender } = renderHook(
      ({ filters }) => useTransactions(filters, "user-1"),
      {
        initialProps: { filters: FILTERS },
        wrapper: createWrapper(),
      },
    );
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data.pages).toHaveLength(2);

    rerender({
      filters: {
        ...FILTERS,
        services: ["data"],
      },
    });
    await waitFor(() => {
      expect(requests).toHaveLength(3);
      expect(result.current.data?.pages).toHaveLength(1);
    });

    expect(requests[2].searchParams.get("type")).toBe("data");
    expect(requests[2].searchParams.has("cursor")).toBe(false);
  });

  test("cancels an obsolete request when the active filter key changes", async () => {
    let oldSignal;
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation(
      (input, options) => {
        const url = new URL(input);
        if (url.searchParams.get("type") === "airtime") {
          oldSignal = options.signal;
          return new Promise((resolve, reject) => {
            options.signal.addEventListener("abort", () => {
              const error = new Error("aborted");
              error.name = "AbortError";
              reject(error);
            });
          });
        }
        return Promise.resolve(jsonResponse(page(["data:1"])));
      },
    );

    const { result, rerender } = renderHook(
      ({ filters }) => useTransactions(filters, "user-1"),
      {
        initialProps: { filters: FILTERS },
        wrapper: createWrapper(),
      },
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender({
      filters: {
        ...FILTERS,
        services: ["data"],
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(oldSignal.aborted).toBe(true);
    expect(result.current.data.pages[0].transactions[0].id).toBe("data:1");
  });

  test("reports no next page when the service returns a null cursor", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(jsonResponse(page(["airtime:1"])));

    const { result } = renderHook(
      () => useTransactions(FILTERS, "user-1"),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  test("does not request or expose transactions without an authenticated user identity", async () => {
    const fetchMock = jest.spyOn(global, "fetch");
    const { result } = renderHook(() => useTransactions(FILTERS, null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(result.current.data).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

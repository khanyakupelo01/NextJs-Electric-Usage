import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/index";

const apiPayload = {
  status: "success",
  date_from: "2026-07-01",
  date_to: "2026-07-31",
  type: [],
  transactions: [
    {
      id: "airtime:1",
      service: "airtime",
      status: "success",
      reason: null,
      reference: "INV-1001",
      created_at: "2026-07-29 09:31:20",
      updated_at: "2026-07-29 09:31:48",
    },
  ],
  pagination: { limit: 50, next_cursor: null },
};

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Home currentUser={{ id: "user-1" }} />
    </QueryClientProvider>,
  );
}

function applyDates() {
  fireEvent.change(screen.getByLabelText("From date"), {
    target: { value: "2026-07-01" },
  });
  fireEvent.change(screen.getByLabelText("To date"), {
    target: { value: "2026-07-31" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
}

function mockResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("transactions dashboard", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api/v1";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
  });

  test("does not request data until a valid date range is applied", () => {
    const fetchMock = jest.spyOn(global, "fetch");
    renderDashboard();

    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a start and end date.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("requires an authenticated user identity before requesting transactions", () => {
    const fetchMock = jest.spyOn(global, "fetch");
    render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { gcTime: 0, retry: false } },
          })
        }
      >
        <Home />
      </QueryClientProvider>,
    );

    applyDates();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sign in to view your transactions.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("shows the user's newest-first transaction results", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(mockResponse(200, apiPayload));
    renderDashboard();

    applyDates();

    expect(await screen.findByText("INV-1001")).toBeInTheDocument();
    expect(screen.getAllByText("Airtime")).not.toHaveLength(0);
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("29 Jul 2026, 09:31:20")).toBeInTheDocument();
    expect(screen.getByText("29 Jul 2026, 09:31:48")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  test("shows a distinct empty state", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      mockResponse(200, { ...apiPayload, transactions: [] }),
    );
    renderDashboard();

    applyDates();

    expect(
      await screen.findByText("No transactions found for these filters."),
    ).toBeInTheDocument();
  });

  test("loads the next cursor page and indicates when there are no more results", async () => {
    const nextPage = {
      ...apiPayload,
      transactions: [
        {
          id: "data:2",
          service: "data",
          status: "pending",
          reason: null,
          reference: "INV-1002",
          created_at: "2026-07-28 08:20:00",
          updated_at: "2026-07-28 08:20:15",
        },
      ],
      pagination: { limit: 50, next_cursor: null },
    };
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = new URL(input);
      return Promise.resolve(
        mockResponse(
          200,
          url.searchParams.has("cursor")
            ? nextPage
            : { ...apiPayload, pagination: { limit: 50, next_cursor: "cursor-2" } },
        ),
      );
    });
    renderDashboard();

    applyDates();
    expect(await screen.findByText("INV-1001")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("INV-1002")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("cursor")).toBe(
      "cursor-2",
    );
    expect(screen.getByText("No more transactions to load.")).toBeInTheDocument();
  });

  test("shows an access message and no transactions on HTTP 401", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      mockResponse(401, {
        error: {
          code: "UNAUTHENTICATED",
          message: "Please sign in again to view your transactions.",
        },
      }),
    );
    renderDashboard();

    applyDates();

    expect(
      await screen.findByText("Please sign in again to view your transactions."),
    ).toBeInTheDocument();
    expect(screen.queryByText("INV-1001")).not.toBeInTheDocument();
  });

  test("offers retry when the transaction service is unavailable", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      mockResponse(503, {
        error: { code: "UPSTREAM_ERROR", message: "provider detail" },
      }),
    );
    renderDashboard();

    applyDates();

    expect(
      await screen.findByText(
        "The transaction service is temporarily unavailable. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("provider detail")).toBeNull());
  });
});

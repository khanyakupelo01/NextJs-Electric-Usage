import { render, screen } from "@testing-library/react";
import TransactionRow from "@/features/transactions/components/TransactionRow";
import TransactionStatus from "@/features/transactions/components/TransactionStatus";

const baseTransaction = {
  id: "airtime:1",
  service: "airtime",
  status: "success",
  reason: null,
  reference: "INV-1001",
  created_at: "2026-07-29 09:31:20",
  updated_at: "2026-07-29 09:31:48",
};

function renderRow(transaction) {
  return render(
    <table>
      <tbody>
        <TransactionRow transaction={transaction} />
      </tbody>
    </table>,
  );
}

describe("TransactionStatus", () => {
  test.each([
    ["success", "Success"],
    ["failed", "Failed"],
    ["pending", "Pending"],
  ])("labels the %s state for assistive technology", (status, label) => {
    render(<TransactionStatus status={status} />);
    expect(
      screen.getByRole("status", { name: `Status: ${label}` }),
    ).toHaveTextContent(label);
  });
});

describe("TransactionRow details", () => {
  test("shows the recorded failure reason", () => {
    renderRow({
      ...baseTransaction,
      status: "failed",
      reason: "Supplier rejected the order",
    });

    expect(screen.getByText("Supplier rejected the order")).toBeInTheDocument();
  });

  test("uses explicit fallback text for missing failure reason and reference", () => {
    renderRow({
      ...baseTransaction,
      status: "failed",
      reason: null,
      reference: null,
    });

    expect(screen.getByText("No reason provided")).toBeInTheDocument();
    expect(screen.getByText("Not provided")).toBeInTheDocument();
  });

  test("explains that pending SMS is awaiting its delivery receipt", () => {
    renderRow({
      ...baseTransaction,
      service: "sms",
      status: "pending",
    });

    expect(
      screen.getByText("SMS delivery confirmation is still pending."),
    ).toBeInTheDocument();
  });
});

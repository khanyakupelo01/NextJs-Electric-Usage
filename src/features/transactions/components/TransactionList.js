import TransactionRow from "@/features/transactions/components/TransactionRow";

function ErrorMessage({ error, onRetry }) {
  const retryable =
    !Number.isInteger(error?.status) ||
    error.status === 0 ||
    error.status >= 500;
  const message =
    error?.message || "We could not retrieve your transactions.";

  return (
    <div
      className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900"
      role="alert"
    >
      <p className="font-semibold">{message}</p>
      {retryable ? (
        <button
          className="mt-3 min-h-10 rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-800 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
          onClick={onRetry}
          type="button"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export default function TransactionList({ query, transactions }) {
  if (query.isPending) {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600"
        role="status"
      >
        Loading transactions…
      </div>
    );
  }

  if (query.isError && !query.data) {
    return <ErrorMessage error={query.error} onRetry={() => query.refetch()} />;
  }

  if (transactions.length === 0 && !query.hasNextPage) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h3 className="font-semibold text-slate-900">No transactions found</h3>
        <p className="mt-2 text-sm text-slate-600">
          No transactions found for these filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              <th
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                scope="col"
              >
                Service
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                scope="col"
              >
                Status
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                scope="col"
              >
                Reference
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                scope="col"
              >
                Details
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                scope="col"
              >
                Created
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                scope="col"
              >
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </tbody>
        </table>
      </div>
      {query.isFetchNextPageError ? (
        <div className="border-t border-slate-200 p-4">
          <ErrorMessage
            error={query.error}
            onRetry={() => query.loadNextPage()}
          />
        </div>
      ) : null}
      <div className="flex justify-center border-t border-slate-100 p-4">
        {query.hasNextPage ? (
          <button
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60"
            disabled={query.isFetching}
            onClick={() => query.loadNextPage()}
            type="button"
          >
            {query.isFetchingNextPage ? "Loading more…" : "Load more"}
          </button>
        ) : (
          <p className="text-sm text-slate-500" aria-live="polite">
            No more transactions to load.
          </p>
        )}
      </div>
    </div>
  );
}

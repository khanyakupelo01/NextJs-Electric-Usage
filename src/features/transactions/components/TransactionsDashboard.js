import { useState } from "react";
import TransactionFilters from "@/features/transactions/components/TransactionFilters";
import TransactionList from "@/features/transactions/components/TransactionList";
import {
  getDateRangeError,
  normalizeServices,
} from "@/features/transactions/filters";
import {
  getUniqueTransactions,
  useTransactions,
} from "@/features/transactions/hooks/useTransactions";
import { getStableUserId } from "@/features/transactions/userIdentity";

const INITIAL_FILTERS = { dateFrom: "", dateTo: "", services: [] };

export default function TransactionsDashboard({ userId }) {
  const stableUserId = getStableUserId(userId);
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);
  const [activeFilters, setActiveFilters] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const query = useTransactions(activeFilters, stableUserId);
  const validationError = getDateRangeError(
    draftFilters.dateFrom,
    draftFilters.dateTo,
  );
  const transactions = getUniqueTransactions(query.data?.pages);

  function updateDraft(patch) {
    setDraftFilters((current) => ({ ...current, ...patch }));
    setActiveFilters(null);
  }

  function applyFilters(event) {
    event.preventDefault();
    setShowValidation(true);
    if (validationError) {
      setActiveFilters(null);
      return;
    }

    setShowValidation(false);
    setActiveFilters({
      dateFrom: draftFilters.dateFrom,
      dateTo: draftFilters.dateTo,
      services: normalizeServices(draftFilters.services),
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a
            className="inline-flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
            href="/"
            aria-label="SIMcloud transaction history home"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-blue-700 text-lg font-bold text-white">
              S
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                SIMcloud
              </span>
              <span className="block text-xs text-slate-500">
                Account activity
              </span>
            </span>
          </a>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            Transaction history
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="mb-7">
          <p className="text-sm font-semibold text-blue-700">Your account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Transaction history
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Review your service activity, check transaction status, and find
            details for unsuccessful transactions.
          </p>
        </section>

        <section aria-label="Transaction filters">
          <TransactionFilters
            filters={draftFilters}
            validationError={validationError}
            showValidation={showValidation}
            onChange={updateDraft}
            onSubmit={applyFilters}
          />
        </section>

        <section className="mt-8" aria-labelledby="results-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                className="text-xl font-semibold text-slate-900"
                id="results-heading"
              >
                Results
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {activeFilters
                  ? `${activeFilters.dateFrom} to ${activeFilters.dateTo}`
                  : "Choose a date range to view transactions."}
              </p>
            </div>
            {activeFilters ? (
              <span className="text-sm text-slate-500">
                {transactions.length} loaded
              </span>
            ) : null}
          </div>
          {activeFilters ? (
            stableUserId ? (
              <TransactionList query={query} transactions={transactions} />
            ) : (
              <div
                className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900"
                role="alert"
              >
                Sign in to view your transactions.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
              Your transactions will appear here after you apply a date range.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

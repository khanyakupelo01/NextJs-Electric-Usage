import { TRANSACTION_SERVICES } from "@/features/transactions/filters";

const SERVICE_LABELS = {
  airtime: "Airtime",
  data: "Data",
  electricity: "Electricity",
  vas: "VAS",
  sms: "SMS",
};

export default function TransactionFilters({
  filters,
  validationError,
  showValidation,
  onChange,
  onSubmit,
}) {
  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Filter transactions
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose an inclusive date range of up to 90 days.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          From date
          <input
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => onChange({ dateFrom: event.target.value })}
            aria-invalid={showValidation && Boolean(validationError)}
            aria-describedby={
              showValidation && validationError ? "filter-error" : undefined
            }
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          To date
          <input
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            type="date"
            value={filters.dateTo}
            onChange={(event) => onChange({ dateTo: event.target.value })}
            aria-invalid={showValidation && Boolean(validationError)}
            aria-describedby={
              showValidation && validationError ? "filter-error" : undefined
            }
          />
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-slate-700">
          Services
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRANSACTION_SERVICES.map((service) => {
            const selected = filters.services.includes(service);
            return (
              <label
                key={service}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition ${
                  selected
                    ? "border-blue-600 bg-blue-50 text-blue-800"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                <input
                  className="size-4 accent-blue-700"
                  type="checkbox"
                  checked={selected}
                  onChange={(event) =>
                    onChange({
                      services: event.target.checked
                        ? [...filters.services, service]
                        : filters.services.filter((item) => item !== service),
                    })
                  }
                />
                {SERVICE_LABELS[service]}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Leave all services unchecked to include every service.
        </p>
      </fieldset>

      {showValidation && validationError ? (
        <p
          className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"
          id="filter-error"
          role="alert"
        >
          {validationError}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          className="min-h-11 rounded-lg bg-blue-700 px-5 font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          type="submit"
        >
          Apply filters
        </button>
      </div>
    </form>
  );
}

const STATUS_PRESENTATION = {
  success: {
    label: "Success",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  failed: {
    label: "Failed",
    classes: "border-rose-200 bg-rose-50 text-rose-800",
  },
  pending: {
    label: "Pending",
    classes: "border-amber-200 bg-amber-50 text-amber-900",
  },
};

export default function TransactionStatus({ status }) {
  const presentation = STATUS_PRESENTATION[status] ?? {
    label: "Unknown",
    classes: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${presentation.classes}`}
      role="status"
      aria-label={`Status: ${presentation.label}`}
    >
      {presentation.label}
    </span>
  );
}

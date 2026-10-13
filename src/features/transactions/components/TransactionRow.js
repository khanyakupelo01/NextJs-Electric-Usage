import TransactionStatus from "@/features/transactions/components/TransactionStatus";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SERVICE_LABELS = {
  airtime: "Airtime",
  data: "Data",
  electricity: "Electricity",
  vas: "VAS",
  sms: "SMS",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: "Africa/Johannesburg",
});

function formatTimestamp(value) {
  const match =
    typeof value === "string" &&
    value.match(
      /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
    );
  if (!match) {
    return { label: "Not provided" };
  }

  const [, year, month, day, hours, minutes, seconds] = match;
  const monthName = MONTHS[Number(month) - 1];
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    ),
  );
  if (
    !monthName ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day) ||
    Number(hours) > 23 ||
    Number(minutes) > 59 ||
    Number(seconds) > 59
  ) {
    return { label: "Not provided" };
  }

  const dateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+02:00`;
  return {
    dateTime,
    label: DATE_TIME_FORMATTER.format(new Date(dateTime)),
  };
}

export default function TransactionRow({ transaction }) {
  const created = formatTimestamp(transaction.created_at);
  const updated = formatTimestamp(transaction.updated_at);
  const reason = transaction.reason?.trim();
  const detail =
    transaction.status === "failed"
      ? reason || "No reason provided"
      : transaction.service === "sms" && transaction.status === "pending"
        ? "SMS delivery confirmation is still pending."
        : "—";

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-4">
        <span className="font-medium text-slate-900">
          {SERVICE_LABELS[transaction.service] ?? transaction.service}
        </span>
      </td>
      <td className="px-4 py-4">
        <TransactionStatus status={transaction.status} />
      </td>
      <td className="max-w-56 break-words px-4 py-4 text-sm text-slate-700">
        {transaction.reference?.trim() || "Not provided"}
      </td>
      <td className="max-w-72 break-words px-4 py-4 text-sm text-slate-600">
        {detail}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
        <time dateTime={created.dateTime}>{created.label}</time>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
        <time dateTime={updated.dateTime}>{updated.label}</time>
      </td>
    </tr>
  );
}

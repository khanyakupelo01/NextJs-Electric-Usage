export const TRANSACTION_SERVICES = [
  "airtime",
  "data",
  "electricity",
  "vas",
  "sms",
];

const SERVICE_SET = new Set(TRANSACTION_SERVICES);
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

export function getDateRangeError(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) {
    return "Choose a start and end date.";
  }

  const start = parseDate(dateFrom);
  const end = parseDate(dateTo);
  if (!start || !end) {
    return "Enter valid dates.";
  }

  if (end < start) {
    return "End date must be on or after the start date.";
  }

  const inclusiveDays = Math.floor((end - start) / DAY_MS) + 1;
  if (inclusiveDays > 90) {
    return "Select a range of 90 days or fewer.";
  }

  return null;
}

export function normalizeServices(services) {
  if (!Array.isArray(services)) {
    return [];
  }

  return [...new Set(services.filter((service) => SERVICE_SET.has(service)))].sort();
}

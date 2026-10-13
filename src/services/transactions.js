import { ApiError, apiFetch } from "@/services/api";
import {
  normalizeServices,
  TRANSACTION_SERVICES,
} from "@/features/transactions/filters";

const STATUSES = new Set(["success", "failed", "pending"]);
const SERVICE_SET = new Set(TRANSACTION_SERVICES);

export function buildTransactionParams({
  dateFrom,
  dateTo,
  services,
  cursor,
  limit = 50,
}) {
  const normalizedServices = normalizeServices(services);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(
      400,
      "INVALID_LIMIT",
      "The transaction page size must be between 1 and 100.",
    );
  }

  return {
    date_from: dateFrom,
    date_to: dateTo,
    ...(normalizedServices.length > 0
      ? { type: normalizedServices.join(",") }
      : {}),
    limit,
    ...(cursor ? { cursor } : {}),
  };
}

function isNullableString(value) {
  return value === null || value === undefined || typeof value === "string";
}

function isValidTransaction(transaction) {
  return (
    transaction !== null &&
    typeof transaction === "object" &&
    typeof transaction.id === "string" &&
    transaction.id.length > 0 &&
    SERVICE_SET.has(transaction.service) &&
    STATUSES.has(transaction.status) &&
    isNullableString(transaction.reason) &&
    isNullableString(transaction.reference) &&
    typeof transaction.created_at === "string" &&
    typeof transaction.updated_at === "string"
  );
}

function validatePage(page) {
  const pagination = page?.pagination;
  if (
    page?.status !== "success" ||
    !Array.isArray(page.transactions) ||
    !page.transactions.every(isValidTransaction) ||
    !pagination ||
    !Number.isInteger(pagination.limit) ||
    pagination.limit < 1 ||
    pagination.limit > 100 ||
    !isNullableString(pagination.next_cursor)
  ) {
    throw new ApiError(
      502,
      "INVALID_RESPONSE",
      "The transaction service returned an invalid response.",
    );
  }

  return page;
}

export async function fetchTransactions(filters, { cursor, signal, limit } = {}) {
  const page = await apiFetch("transactions", {
    query: buildTransactionParams({ ...filters, cursor, limit }),
    signal,
  });

  return validatePage(page);
}

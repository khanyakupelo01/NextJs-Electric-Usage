import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getDateRangeError,
  normalizeServices,
} from "@/features/transactions/filters";
import { getQueryUserId } from "@/features/transactions/userIdentity";
import { fetchTransactions } from "@/services/transactions";

export function getUniqueTransactions(pages = []) {
  const seenIds = new Set();
  return pages.flatMap((page) =>
    page.transactions.filter((transaction) => {
      if (seenIds.has(transaction.id)) {
        return false;
      }

      seenIds.add(transaction.id);
      return true;
    }),
  );
}

export function getTransactionsQueryKey(filters, userId) {
  const stableUserId = getQueryUserId(userId);
  if (!filters) {
    return ["transactions", stableUserId, "unapplied"];
  }

  return [
    "transactions",
    stableUserId,
    filters.dateFrom,
    filters.dateTo,
    normalizeServices(filters.services),
  ];
}

export function useTransactions(filters, userId) {
  const stableUserId = getQueryUserId(userId);
  const normalizedFilters = filters
    ? { ...filters, services: normalizeServices(filters.services) }
    : null;

  const query = useInfiniteQuery({
    queryKey: getTransactionsQueryKey(normalizedFilters, stableUserId),
    queryFn: ({ pageParam, signal }) =>
      fetchTransactions(normalizedFilters, {
        cursor: pageParam ?? undefined,
        signal,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      const nextCursor = lastPage.pagination.next_cursor;
      return typeof nextCursor === "string" && nextCursor.length > 0
        ? nextCursor
        : undefined;
    },
    enabled:
      Boolean(stableUserId) &&
      Boolean(normalizedFilters) &&
      !getDateRangeError(
        normalizedFilters?.dateFrom,
        normalizedFilters?.dateTo,
      ),
    gcTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  return {
    ...query,
    loadNextPage: () => {
      if (!query.hasNextPage || query.isFetching) {
        return undefined;
      }

      return query.fetchNextPage({ cancelRefetch: false });
    },
  };
}

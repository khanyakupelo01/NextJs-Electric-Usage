import { useEffect, useRef, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { getStableUserId } from "@/features/transactions/userIdentity";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 0,
            retry: false,
            staleTime: 0,
          },
        },
      }),
  );
  const userId = getStableUserId(pageProps?.currentUser?.id);
  const previousUserId = useRef(userId);

  useEffect(() => {
    if (previousUserId.current === userId) {
      return;
    }

    queryClient.removeQueries({
      queryKey: ["transactions"],
      predicate: (query) => userId === null || query.queryKey[1] !== userId,
    });
    previousUserId.current = userId;
  }, [queryClient, userId]);

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}

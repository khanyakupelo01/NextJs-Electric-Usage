import { useEffect, useSyncExternalStore } from "react";
import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import App from "@/pages/_app";

function SessionCacheProbe() {
  const queryClient = useQueryClient();
  const transactionQueryCount = useSyncExternalStore(
    (onChange) => queryClient.getQueryCache().subscribe(onChange),
    () =>
      queryClient.getQueryCache().findAll({ queryKey: ["transactions"] })
        .length,
    () => 0,
  );

  useEffect(() => {
    queryClient.setQueryData(
      ["transactions", "user-1", "cached"],
      "cached user-1 transaction",
    );
  }, [queryClient]);

  return (
    <p>
      {transactionQueryCount === 0
        ? "no cached transaction data"
        : "cached user-1 transaction"}
    </p>
  );
}

describe("authenticated session transaction cache", () => {
  test.each([
    ["account switch", { currentUser: { id: "user-2" } }],
    ["sign-out", {}],
  ])(
    "clears the previous account's transactions on %s",
    async (_, pageProps) => {
      const { rerender } = render(
        <App
          Component={SessionCacheProbe}
          pageProps={{ currentUser: { id: "user-1" } }}
        />,
      );

      expect(
        await screen.findByText("cached user-1 transaction"),
      ).toBeInTheDocument();

      rerender(<App Component={SessionCacheProbe} pageProps={pageProps} />);

      expect(
        await screen.findByText("no cached transaction data"),
      ).toBeInTheDocument();
    },
  );
});

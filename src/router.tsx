import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 10_000,
    // Don't show a pending veil for quick transitions — that veil is what read
    // as the page "flashing back" before the new one arrived.
    defaultPendingMs: 800,
    defaultPendingMinMs: 300,
  });

  return router;
};

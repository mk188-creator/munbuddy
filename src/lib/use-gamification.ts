import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getGamificationState } from "@/lib/gamification.functions";

export function useGamification() {
  const fetchState = useServerFn(getGamificationState);
  return useQuery({
    queryKey: ["gamification"],
    queryFn: () => fetchState({}),
    staleTime: 15_000,
  });
}

export type GamificationState = NonNullable<ReturnType<typeof useGamification>["data"]>;

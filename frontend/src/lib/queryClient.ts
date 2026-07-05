import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Central place for query keys so realtime invalidation stays consistent.
export const qk = {
  users: ["users"] as const,
  boards: ["boards"] as const,
  boardsByUser: (userId: string) => ["boards", "user", userId] as const,
  board: (id: string) => ["board", id] as const,
  boardFull: (id: string) => ["board", id, "full"] as const,
  activity: (id: string) => ["board", id, "activity"] as const,
};

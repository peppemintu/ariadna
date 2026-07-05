// Live board updates. Subscribes to the board's STOMP topic and invalidates the
// board (and its activity) on any event, letting TanStack Query refetch truth.
// We don't hand-patch the cache per event type — that couples us to payload
// shapes; a refetch of the aggregate is cheap and robust.

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeBoard, subscribeConnection } from "@/lib/stomp";
import { qk } from "@/lib/queryClient";
import type { UUID } from "@/api/types";

export function useBoardRealtime(boardId: UUID | undefined) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    const unsub = subscribeBoard(boardId, () => {
      qc.invalidateQueries({ queryKey: qk.boardFull(boardId) });
      qc.invalidateQueries({ queryKey: qk.activity(boardId) });
    });
    return unsub;
  }, [boardId, qc]);

  useEffect(() => subscribeConnection(setConnected), []);

  return { connected };
}

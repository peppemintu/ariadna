// Live invitation notifications. Subscribes to the user's private STOMP queue
// and invalidates the pending-invitations query on any push, letting TanStack
// Query refetch truth — same pattern as useBoardRealtime for board topics.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeNotifications } from "@/lib/stomp";
import { qk } from "@/lib/queryClient";

export function useNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    return subscribeNotifications(() => {
      qc.invalidateQueries({ queryKey: qk.invitations });
    });
  }, [qc]);
}

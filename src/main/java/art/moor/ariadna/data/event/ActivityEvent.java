package art.moor.ariadna.data.event;

import art.moor.ariadna.data.model.ActionType;

import java.util.Map;
import java.util.UUID;

public record ActivityEvent(
        UUID boardId,
        UUID targetItemId,
        UUID userId,
        ActionType actionType,
        Map<String, Object> payload
) {}

package art.moor.ariadna.domain.event;

import art.moor.ariadna.domain.model.ActionType;

import java.util.Map;
import java.util.UUID;

public record ActivityEvent(
        UUID boardId,
        UUID targetItemId,   // null если событие не про конкретный item
        UUID userId,         // null пока нет auth
        ActionType actionType,
        Map<String, Object> payload
) {}

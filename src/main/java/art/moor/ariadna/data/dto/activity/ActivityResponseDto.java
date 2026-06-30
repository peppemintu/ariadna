package art.moor.ariadna.data.dto.activity;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ActivityResponseDto (
        UUID id,
        UUID boardId,
        UUID targetItemId,
        UUID userId,
        String actionType,
        Map<String, Object> payload,
        Instant createdAt
) {}

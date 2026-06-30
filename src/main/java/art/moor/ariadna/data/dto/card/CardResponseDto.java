package art.moor.ariadna.domain.dto.card;

import java.time.Instant;
import java.util.UUID;

public record CardResponseDto(
        UUID id,
        UUID boardId,
        UUID columnId,
        String title,
        String description,
        Instant deadline,
        UUID assigneeId,
        double position,
        long version,
        Instant createdAt,
        Instant updatedAt
) {}

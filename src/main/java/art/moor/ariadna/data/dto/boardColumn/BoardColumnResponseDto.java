package art.moor.ariadna.data.dto.boardColumn;

import java.time.Instant;
import java.util.UUID;

public record BoardColumnResponseDto(
        UUID id,
        UUID boardId,
        String title,
        String color,
        double position,
        long version,
        Instant createdAt,
        Instant updatedAt
) {}

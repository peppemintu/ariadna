package art.moor.ariadna.domain.dto.board;

import java.time.Instant;
import java.util.UUID;

public record BoardResponseDto (
        UUID id,
        String title,
        Instant createdAt,
        Instant updatedAt
) {}

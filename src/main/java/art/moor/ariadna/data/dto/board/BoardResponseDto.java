package art.moor.ariadna.data.dto.board;

import java.time.Instant;
import java.util.UUID;

public record BoardResponseDto (
        UUID id,
        String title,
        UUID ownerId,
        Instant createdAt,
        Instant updatedAt,
        BoardMyAccessDto myAccess
) {}

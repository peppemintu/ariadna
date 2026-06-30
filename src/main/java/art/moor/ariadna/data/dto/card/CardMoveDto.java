package art.moor.ariadna.data.dto.card;

import java.util.UUID;

public record CardMoveDto(
        UUID targetColumnId,
        UUID prevCardId,
        UUID nextCardId,
        long version
) {}

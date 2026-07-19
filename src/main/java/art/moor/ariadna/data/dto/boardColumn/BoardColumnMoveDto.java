package art.moor.ariadna.data.dto.boardColumn;

import java.util.UUID;

public record BoardColumnMoveDto(
        UUID prevColumnId,
        UUID nextColumnId,
        long version
) {}

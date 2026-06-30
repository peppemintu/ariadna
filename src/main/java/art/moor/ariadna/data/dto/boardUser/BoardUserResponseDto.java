package art.moor.ariadna.data.dto.boardUser;

import java.util.UUID;

public record BoardUserResponseDto(
        UUID id,
        UUID boardId,
        UUID userId
) {}

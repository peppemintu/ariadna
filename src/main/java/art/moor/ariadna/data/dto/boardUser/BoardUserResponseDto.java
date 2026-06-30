package art.moor.ariadna.domain.dto.boardUser;

import java.util.UUID;

public record BoardUserResponseDto(
        UUID id,
        UUID boardId,
        UUID userId
) {}

package art.moor.ariadna.data.dto.board;

import art.moor.ariadna.data.dto.boardColumn.BoardColumnWithCardsDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BoardFullDto(
        UUID id,
        String title,
        Instant createdAt,
        Instant updatedAt,
        List<UserResponseDto> members,
        List<BoardColumnWithCardsDto> columns
) {}

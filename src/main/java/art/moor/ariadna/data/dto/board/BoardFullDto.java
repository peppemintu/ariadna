package art.moor.ariadna.data.dto.board;

import art.moor.ariadna.data.dto.boardColumn.BoardColumnWithCardsDto;
import art.moor.ariadna.data.dto.boardUser.BoardMemberDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BoardFullDto(
        UUID id,
        String title,
        UUID ownerId,
        Instant createdAt,
        Instant updatedAt,
        BoardMyAccessDto myAccess,
        List<BoardMemberDto> members,
        List<BoardColumnWithCardsDto> columns
) {}

package art.moor.ariadna.data.dto.boardColumn;

import art.moor.ariadna.data.dto.card.CardResponseDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BoardColumnWithCardsDto(
        UUID id,
        UUID boardId,
        String title,
        String color,
        double position,
        long version,
        Instant createdAt,
        Instant updatedAt,
        List<CardResponseDto> cards
) {}

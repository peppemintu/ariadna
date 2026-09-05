package art.moor.ariadna.data.dto.invitation;

import art.moor.ariadna.data.model.InvitationStatus;

import java.time.Instant;
import java.util.UUID;

public record InvitationResponseDto(
        UUID id,
        UUID boardId,
        String boardTitle,
        String invitedEmail,
        UUID invitedById,
        String invitedByName,
        InvitationStatus status,
        Instant createdAt,
        Instant respondedAt
) {}

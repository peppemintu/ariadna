package art.moor.ariadna.data.event;

import art.moor.ariadna.data.dto.invitation.InvitationResponseDto;

public record InvitationEvent(
        String invitedEmail,
        InvitationResponseDto invitation
) {}

package art.moor.ariadna.data.dto.boardUser;

import art.moor.ariadna.data.model.BoardPermission;

import java.util.Set;
import java.util.UUID;

/**
 * A board member for list rendering: identity + rights in one shape so the
 * frontend never has to join two lists together. `id` is the USER id (kept
 * consistent with UserResponseDto.id, since assignee-matching and avatars key
 * off it everywhere already); `boardUserId` is the board_user row id, the
 * target for permission changes / removal.
 */
public record BoardMemberDto(
        UUID id,
        UUID boardUserId,
        String name,
        String email,
        boolean owner,
        Set<BoardPermission> permissions
) {}

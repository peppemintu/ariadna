package art.moor.ariadna.config.security;

import art.moor.ariadna.data.model.BoardPermission;
import art.moor.ariadna.service.BoardAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Guard-bean front door for endpoints keyed by a nested resource's own id
 * (columns, cards) rather than a boardId path variable — the board isn't known
 * until the entity is loaded, so this runs inside the service method instead of
 * a declarative @PreAuthorize. Board-rooted endpoints use
 * {@link BoardPermissionEvaluator} + @PreAuthorize instead; both call into the
 * same {@link BoardAccess}.
 */
@Component
@RequiredArgsConstructor
public class BoardAccessGuard {

    private final BoardAccess boardAccess;

    public void requireMember(UUID boardId) {
        if (!boardAccess.isMember(CurrentUser.id(), boardId)) {
            throw new AccessDeniedException("Not a member of this board");
        }
    }

    public void requireOwner(UUID boardId) {
        if (!boardAccess.isOwner(CurrentUser.id(), boardId)) {
            throw new AccessDeniedException("Only the board owner can do this");
        }
    }

    public void requirePermission(UUID boardId, BoardPermission permission) {
        if (!boardAccess.hasPermission(CurrentUser.id(), boardId, permission)) {
            throw new AccessDeniedException("Missing board permission: " + permission);
        }
    }
}

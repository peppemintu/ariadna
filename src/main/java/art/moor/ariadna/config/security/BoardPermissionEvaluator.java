package art.moor.ariadna.config.security;

import art.moor.ariadna.data.model.BoardPermission;
import art.moor.ariadna.service.BoardAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.UUID;

/**
 * Declarative front door for board-rooted endpoints: {@code @PreAuthorize(
 * "hasPermission(#boardId, 'BOARD', 'EDIT_CARDS')")}. 'READ' and 'OWNER' are
 * pseudo-permissions resolved to membership/ownership checks; everything else
 * is a real {@link BoardPermission}. Delegates entirely to {@link BoardAccess}
 * — this class knows nothing about how permissions are computed or stored.
 */
@Component
@RequiredArgsConstructor
public class BoardPermissionEvaluator implements PermissionEvaluator {

    private final BoardAccess boardAccess;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        return false; // unused: we always check by (boardId, 'BOARD', permission), not a loaded object
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (!"BOARD".equals(targetType) || !(authentication.getPrincipal() instanceof CustomUserDetails details)) {
            return false;
        }
        UUID boardId = UUID.fromString(targetId.toString());
        UUID userId = details.getUser().getId();

        return switch (permission.toString()) {
            case "READ" -> boardAccess.isMember(userId, boardId);
            case "OWNER" -> boardAccess.isOwner(userId, boardId);
            default -> boardAccess.hasPermission(userId, boardId, BoardPermission.valueOf(permission.toString()));
        };
    }
}

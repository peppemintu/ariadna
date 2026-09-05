package art.moor.ariadna.service;

import art.moor.ariadna.data.model.BoardPermission;

import java.util.UUID;

/**
 * Pure permission-resolution logic for boards — no Spring Security types here
 * on purpose. Endpoint-protection mechanisms (BoardAccessGuard,
 * BoardPermissionEvaluator) are thin adapters over this; swapping how an
 * endpoint is protected never touches this class.
 */
public interface BoardAccess {
    boolean isMember(UUID userId, UUID boardId);

    boolean isOwner(UUID userId, UUID boardId);

    boolean hasPermission(UUID userId, UUID boardId, BoardPermission permission);
}

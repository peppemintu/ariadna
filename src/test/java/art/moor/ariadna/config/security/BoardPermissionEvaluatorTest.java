package art.moor.ariadna.config.security;

import art.moor.ariadna.data.model.BoardPermission;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.data.model.UserRole;
import art.moor.ariadna.service.BoardAccess;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BoardPermissionEvaluatorTest {

    private final BoardAccess boardAccess = mock(BoardAccess.class);
    private final BoardPermissionEvaluator evaluator = new BoardPermissionEvaluator(boardAccess);

    private Authentication authAs(UUID userId) {
        User user = new User();
        user.setId(userId);
        user.setRole(UserRole.USER);
        CustomUserDetails principal = new CustomUserDetails(user);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    void resolvesReadToMembershipCheck() {
        UUID userId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();
        when(boardAccess.isMember(userId, boardId)).thenReturn(true);

        assertThat(evaluator.hasPermission(authAs(userId), boardId, "BOARD", "READ")).isTrue();
    }

    @Test
    void resolvesOwnerToOwnershipCheck() {
        UUID userId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();
        when(boardAccess.isOwner(userId, boardId)).thenReturn(false);

        assertThat(evaluator.hasPermission(authAs(userId), boardId, "BOARD", "OWNER")).isFalse();
    }

    @Test
    void resolvesNamedPermissionToBoardAccessCheck() {
        UUID userId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();
        when(boardAccess.hasPermission(userId, boardId, BoardPermission.EDIT_CARDS)).thenReturn(true);

        assertThat(evaluator.hasPermission(authAs(userId), boardId, "BOARD", "EDIT_CARDS")).isTrue();
    }

    @Test
    void rejectsNonBoardTargetType() {
        UUID userId = UUID.randomUUID();
        UUID boardId = UUID.randomUUID();

        assertThat(evaluator.hasPermission(authAs(userId), boardId, "USER", "READ")).isFalse();
    }

    @Test
    void rejectsNonCustomUserDetailsPrincipal() {
        Authentication anonymousAuth = new UsernamePasswordAuthenticationToken("anonymous", null);

        assertThat(evaluator.hasPermission(anonymousAuth, UUID.randomUUID(), "BOARD", "READ")).isFalse();
    }
}

package art.moor.ariadna.config.security;

import art.moor.ariadna.data.model.User;
import art.moor.ariadna.data.model.UserRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserAccessGuardTest {

    private final UserAccessGuard guard = new UserAccessGuard();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private User user(UUID id, UserRole role) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        return u;
    }

    private void authenticateAs(User user) {
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        principal, null, principal.getAuthorities())
        );
    }

    @Test
    void allowsUserToAccessOwnResource() {
        UUID ownId = UUID.randomUUID();
        authenticateAs(user(ownId, UserRole.USER));

        assertThatCode(() -> guard.checkCanAccess(ownId))
                .doesNotThrowAnyException();
    }

    @Test
    void deniesUserAccessToSomeoneElsesResource() {
        UUID ownId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        authenticateAs(user(ownId, UserRole.USER));

        assertThatThrownBy(() -> guard.checkCanAccess(otherId))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void allowsAdminToAccessAnyResource() {
        UUID adminId = UUID.randomUUID();
        UUID someoneElseId = UUID.randomUUID();
        authenticateAs(user(adminId, UserRole.ADMIN));

        assertThatCode(() -> guard.checkCanAccess(someoneElseId))
                .doesNotThrowAnyException();
    }

}
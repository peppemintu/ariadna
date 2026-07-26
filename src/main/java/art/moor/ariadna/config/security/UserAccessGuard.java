package art.moor.ariadna.config.security;

import art.moor.ariadna.data.model.UserRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UserAccessGuard {
    public void checkCanAccess(UUID targetUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails currentUser = (CustomUserDetails) auth.getPrincipal();

        boolean isAdmin = currentUser.getUser().getRole() == UserRole.ADMIN;
        boolean isSelf = currentUser.getUser().getId().equals(targetUserId);

        if (!isAdmin && !isSelf) {
            throw new AccessDeniedException("Resource access not allowed");
        }
    }
}

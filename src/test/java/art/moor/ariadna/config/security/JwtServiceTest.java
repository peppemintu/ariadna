package art.moor.ariadna.config.security;

import art.moor.ariadna.data.model.User;
import art.moor.ariadna.data.model.UserRole;
import org.junit.jupiter.api.Test;

import java.security.SignatureException;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class JwtServiceTest {

    private final String USER_EMAIL = "user@example.com";
    private final String DIFFERENT_USER_EMAIL = "other@example.com";

    private final JwtService jwtService = new JwtService(
            new JwtProperties(
                    "r9n31zJ4tpxtI+l8RgSCN13f+5Tko+arXlfPbPsyey0=",
                    Duration.ofMinutes(15L),
                    Duration.ofDays(7L)
            )
    );

    private final JwtService otherJwtService = new JwtService(
            new JwtProperties(
                    "1Lwa6TZ1pYDx9TVzZnCUXdn8Bz0pMnv5yWwLfR5N6Ao=",
                    Duration.ofMinutes(15L),
                    Duration.ofDays(7L)
            )
    );

    private User user(UUID id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setRole(UserRole.USER);
        return u;
    }

    @Test
    void generateTokenAndParseSameTokenYieldsSameEmail() {
        CustomUserDetails principal = new CustomUserDetails(user(UUID.randomUUID(), USER_EMAIL));
        String accessToken = jwtService.generateAccessToken(principal);

        assertThat(jwtService.extractEmail(accessToken)).isEqualTo(USER_EMAIL);
    }

    @Test
    void accessTokenExpiresInAboutFifteenMinutes() {
        CustomUserDetails principal = new CustomUserDetails(user(UUID.randomUUID(), USER_EMAIL));
        String accessToken = jwtService.generateAccessToken(principal);
        Instant expiration = jwtService.extractExpiration(accessToken).toInstant();
        Instant now = Instant.now();

        assertThat(expiration).isBetween(now.plus(Duration.ofMinutes(14)), now.plus(Duration.ofMinutes(16)));
    }

    @Test
    void tokenFromDifferentSecretShouldReject() {
        CustomUserDetails principal = new CustomUserDetails(user(UUID.randomUUID(), USER_EMAIL));
        String accessTokenFromDifferentService = otherJwtService.generateAccessToken(principal);

        assertThatThrownBy(() -> jwtService.validateToken(accessTokenFromDifferentService, principal))
                .isInstanceOf(SignatureException.class);
    }

    @Test
    void validateTokenReturnsTrueForMatchingUser() {
        CustomUserDetails principal = new CustomUserDetails(user(UUID.randomUUID(), USER_EMAIL));
        String accessToken = jwtService.generateAccessToken(principal);

        assertThat(jwtService.validateToken(accessToken, principal)).isTrue();
    }

    @Test
    void validateOnInvalidEmailInTokenThrowsException() {
        CustomUserDetails principal = new CustomUserDetails(user(UUID.randomUUID(), USER_EMAIL));
        CustomUserDetails differentEmailPrincipal = new CustomUserDetails(user(UUID.randomUUID(), DIFFERENT_USER_EMAIL));
        String accessToken = jwtService.generateAccessToken(principal);

        assertThat(jwtService.validateToken(accessToken, differentEmailPrincipal)).isFalse();
    }

}

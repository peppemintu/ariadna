package art.moor.ariadna.config.security;

import art.moor.ariadna.data.model.RefreshToken;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.data.model.UserRole;
import art.moor.ariadna.exception.InvalidRefreshTokenException;
import art.moor.ariadna.repo.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RefreshTokenServiceTest {

    private final RefreshTokenRepository repository = mock(RefreshTokenRepository.class);
    private final JwtProperties jwtProperties = new JwtProperties(
            "r9n31zJ4tpxtI+l8RgSCN13f+5Tko+arXlfPbPsyey0=",
            Duration.ofMinutes(15),
            Duration.ofDays(7)
    );
    private final RefreshTokenService service = new RefreshTokenService(repository, jwtProperties);

    private User user(UUID id) {
        User u = new User();
        u.setId(id);
        u.setEmail("user@example.com");
        u.setRole(UserRole.USER);
        return u;
    }

    private RefreshToken tokenFor(User owner, Instant expiresAt, Instant revokedAt) {
        return RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(owner)
                .tokenHash("irrelevant-in-tests")
                .expiresAt(expiresAt)
                .revokedAt(revokedAt)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void issueStoresHashNotTheRawTokenAndReturnsTheRawToken() {
        User user = user(UUID.randomUUID());

        String rawToken = service.issue(user);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(captor.capture());
        RefreshToken saved = captor.getValue();

        assertThat(rawToken).isNotBlank();
        assertThat(saved.getTokenHash()).isNotEqualTo(rawToken);
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    void rotateRejectsUnknownToken() {
        when(repository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.rotate("unknown-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void rotateRejectsExpiredToken() {
        RefreshToken expired = tokenFor(user(UUID.randomUUID()), Instant.now().minus(Duration.ofMinutes(1)), null);
        when(repository.findByTokenHash(any())).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.rotate("some-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void rotateOfAnAlreadyRotatedTokenRevokesEveryActiveTokenForThatUser() {
        UUID userId = UUID.randomUUID();
        RefreshToken alreadyRevoked = tokenFor(
                user(userId), Instant.now().plus(Duration.ofDays(1)), Instant.now().minus(Duration.ofMinutes(1)));
        when(repository.findByTokenHash(any())).thenReturn(Optional.of(alreadyRevoked));

        assertThatThrownBy(() -> service.rotate("stolen-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);

        verify(repository).revokeAllActiveForUser(eq(userId), any());
    }

    @Test
    void rotateOfAnActiveTokenRevokesItAndIssuesAFreshOne() {
        User user = user(UUID.randomUUID());
        RefreshToken active = tokenFor(user, Instant.now().plus(Duration.ofDays(1)), null);
        when(repository.findByTokenHash(any())).thenReturn(Optional.of(active));

        RefreshTokenService.Rotated rotated = service.rotate("current-token");

        assertThat(active.getRevokedAt()).isNotNull();
        assertThat(rotated.user()).isEqualTo(user);
        assertThat(rotated.rawToken()).isNotBlank();
        verify(repository).save(any(RefreshToken.class));
    }

    @Test
    void revokeMarksAMatchingTokenAsRevoked() {
        RefreshToken token = tokenFor(user(UUID.randomUUID()), Instant.now().plus(Duration.ofDays(1)), null);
        when(repository.findByTokenHash(any())).thenReturn(Optional.of(token));

        service.revoke("some-token");

        assertThat(token.getRevokedAt()).isNotNull();
    }

    @Test
    void revokeOfAnUnknownTokenIsANoop() {
        when(repository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatCode(() -> service.revoke("unknown-token")).doesNotThrowAnyException();
    }
}

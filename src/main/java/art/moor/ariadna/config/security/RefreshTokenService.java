package art.moor.ariadna.config.security;

import art.moor.ariadna.data.model.RefreshToken;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.exception.InvalidRefreshTokenException;
import art.moor.ariadna.repo.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Refresh tokens are opaque random strings, not JWTs: the server must be able to
 * revoke a single one before it expires, so it has to be looked up in the DB anyway,
 * which defeats the point of a self-contained JWT for this purpose.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    @Transactional
    public String issue(User user) {
        String rawToken = generateRawToken();
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .tokenHash(hash(rawToken))
                .expiresAt(Instant.now().plus(jwtProperties.refreshTokenExpiration()))
                .createdAt(Instant.now())
                .build();
        refreshTokenRepository.save(token);
        return rawToken;
    }

    public record Rotated(User user, String rawToken) {}

    @Transactional
    public Rotated rotate(String rawToken) {
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(InvalidRefreshTokenException::new);

        if (existing.getRevokedAt() != null) {
            // Reuse of an already-rotated token: the token family is compromised,
            // kill every active session for this user rather than just this one.
            refreshTokenRepository.revokeAllActiveForUser(existing.getUser().getId(), Instant.now());
            throw new InvalidRefreshTokenException();
        }
        if (!existing.isActive()) {
            throw new InvalidRefreshTokenException();
        }

        existing.setRevokedAt(Instant.now());
        String newRawToken = issue(existing.getUser());
        return new Rotated(existing.getUser(), newRawToken);
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken))
                .ifPresent(token -> token.setRevokedAt(Instant.now()));
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

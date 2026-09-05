package art.moor.ariadna.config.security;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RefreshCookieFactory {

    public static final String COOKIE_NAME = "refresh_token";

    private final JwtProperties jwtProperties;

    public ResponseCookie build(String rawToken) {
        return baseBuilder(rawToken)
                .maxAge(jwtProperties.refreshTokenExpiration())
                .build();
    }

    public ResponseCookie clear() {
        return baseBuilder("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseBuilder(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                // Secure cookies still work over plain http on localhost (browsers treat it
                // as a secure context), so this is safe in local dev too.
                .secure(true)
                .sameSite("Strict")
                .path("/api/auth");
    }
}

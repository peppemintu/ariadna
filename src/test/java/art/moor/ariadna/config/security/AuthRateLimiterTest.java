package art.moor.ariadna.config.security;

import art.moor.ariadna.exception.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthRateLimiterTest {

    private final AuthRateLimiter authRateLimiter = new AuthRateLimiter(new RateLimiter());

    @Test
    void blocksLoginAfterFiveAttemptsForTheSameEmail() {
        String ip = "10.0.0.1";
        String email = "user@example.com";

        for (int i = 0; i < 5; i++) {
            assertThatCode(() -> authRateLimiter.checkLogin(ip, email)).doesNotThrowAnyException();
        }

        assertThatThrownBy(() -> authRateLimiter.checkLogin(ip, email))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void loginLimitIsPerEmailNotJustPerIp() {
        String ip = "10.0.0.2";
        for (int i = 0; i < 5; i++) {
            authRateLimiter.checkLogin(ip, "victim@example.com");
        }

        assertThatThrownBy(() -> authRateLimiter.checkLogin(ip, "victim@example.com"))
                .isInstanceOf(TooManyRequestsException.class);
        assertThatCode(() -> authRateLimiter.checkLogin(ip, "someone-else@example.com"))
                .doesNotThrowAnyException();
    }

    @Test
    void blocksRegistrationAfterFiveAttemptsFromTheSameIp() {
        String ip = "10.0.0.3";

        for (int i = 0; i < 5; i++) {
            assertThatCode(() -> authRateLimiter.checkRegister(ip)).doesNotThrowAnyException();
        }

        assertThatThrownBy(() -> authRateLimiter.checkRegister(ip))
                .isInstanceOf(TooManyRequestsException.class);
    }
}

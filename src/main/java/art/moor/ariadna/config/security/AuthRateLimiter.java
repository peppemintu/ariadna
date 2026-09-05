package art.moor.ariadna.config.security;

import art.moor.ariadna.exception.TooManyRequestsException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class AuthRateLimiter {

    private static final int LOGIN_MAX_PER_IP = 10;
    private static final int LOGIN_MAX_PER_EMAIL = 5;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(5);

    private static final int REGISTER_MAX_PER_IP = 5;
    private static final Duration REGISTER_WINDOW = Duration.ofHours(1);

    private final RateLimiter rateLimiter;

    public void checkLogin(String clientIp, String email) {
        boolean ipAllowed = rateLimiter.tryAcquire("login:ip:" + clientIp, LOGIN_MAX_PER_IP, LOGIN_WINDOW);
        boolean emailAllowed = rateLimiter.tryAcquire(
                "login:email:" + email.toLowerCase(), LOGIN_MAX_PER_EMAIL, LOGIN_WINDOW);

        if (!ipAllowed || !emailAllowed) {
            throw new TooManyRequestsException();
        }
    }

    public void checkRegister(String clientIp) {
        if (!rateLimiter.tryAcquire("register:ip:" + clientIp, REGISTER_MAX_PER_IP, REGISTER_WINDOW)) {
            throw new TooManyRequestsException();
        }
    }
}

package art.moor.ariadna.config.security;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterTest {

    private final RateLimiter rateLimiter = new RateLimiter();

    @Test
    void allowsRequestsUpToTheLimit() {
        String key = "key-within-limit";

        for (int i = 0; i < 3; i++) {
            assertThat(rateLimiter.tryAcquire(key, 3, Duration.ofMinutes(1))).isTrue();
        }
    }

    @Test
    void rejectsRequestsBeyondTheLimitWithinTheWindow() {
        String key = "key-over-limit";
        for (int i = 0; i < 3; i++) {
            rateLimiter.tryAcquire(key, 3, Duration.ofMinutes(1));
        }

        assertThat(rateLimiter.tryAcquire(key, 3, Duration.ofMinutes(1))).isFalse();
    }

    @Test
    void tracksDifferentKeysIndependently() {
        String throttledKey = "key-a";
        String freshKey = "key-b";
        for (int i = 0; i < 3; i++) {
            rateLimiter.tryAcquire(throttledKey, 3, Duration.ofMinutes(1));
        }

        assertThat(rateLimiter.tryAcquire(freshKey, 3, Duration.ofMinutes(1))).isTrue();
    }

    @Test
    void resetsOnceTheWindowExpires() throws InterruptedException {
        String key = "key-window-reset";
        Duration window = Duration.ofMillis(50);
        for (int i = 0; i < 2; i++) {
            rateLimiter.tryAcquire(key, 2, window);
        }
        assertThat(rateLimiter.tryAcquire(key, 2, window)).isFalse();

        Thread.sleep(60);

        assertThat(rateLimiter.tryAcquire(key, 2, window)).isTrue();
    }
}

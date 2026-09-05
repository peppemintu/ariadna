package art.moor.ariadna.config.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory fixed-window rate limiter, keyed by an arbitrary string.
 * Good enough for a single-instance deployment; if the app ever runs behind
 * a load balancer with multiple instances, this needs to move to a shared
 * store (e.g. Redis) since each instance would otherwise track its own counters.
 */
@Component
public class RateLimiter {

    private record Window(long windowStartMillis, AtomicInteger count) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public boolean tryAcquire(String key, int maxRequests, Duration window) {
        long now = System.currentTimeMillis();
        long windowMillis = window.toMillis();

        Window current = windows.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStartMillis() >= windowMillis) {
                return new Window(now, new AtomicInteger(1));
            }
            existing.count().incrementAndGet();
            return existing;
        });

        return current.count().get() <= maxRequests;
    }

    @Scheduled(fixedRate = 10, timeUnit = TimeUnit.MINUTES)
    void evictStaleWindows() {
        long cutoff = System.currentTimeMillis() - Duration.ofMinutes(30).toMillis();
        windows.entrySet().removeIf(entry -> entry.getValue().windowStartMillis() < cutoff);
    }
}

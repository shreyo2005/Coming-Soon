package com.asksenior.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory per-key rate limiter.
 *
 * Usage:  rateLimiter.check("otp:" + userId, 3, 60)
 *         → allows up to 3 calls per 60-second window per key.
 *
 * NOTE: This resets on server restart. For multi-instance deployments
 *       replace with a Redis-backed solution (e.g., Redisson or Spring Data Redis).
 */
@Service
public class RateLimiterService {

    private record Window(long startEpochSeconds, int count) {}

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /**
     * @param key         Unique identifier for the rate-limit bucket (e.g. "otp:42")
     * @param maxRequests Maximum allowed requests within the window
     * @param windowSecs  Rolling window size in seconds
     * @throws RuntimeException if the rate limit is exceeded
     */
    public synchronized void check(String key, int maxRequests, long windowSecs) {
        long now = Instant.now().getEpochSecond();
        Window w = windows.get(key);

        if (w == null || now - w.startEpochSeconds() >= windowSecs) {
            // Start a fresh window
            windows.put(key, new Window(now, 1));
        } else if (w.count() < maxRequests) {
            windows.put(key, new Window(w.startEpochSeconds(), w.count() + 1));
        } else {
            long retryAfter = windowSecs - (now - w.startEpochSeconds());
            throw new RuntimeException(
                "Too many requests. Please wait " + retryAfter + " seconds before trying again.");
        }
    }
}

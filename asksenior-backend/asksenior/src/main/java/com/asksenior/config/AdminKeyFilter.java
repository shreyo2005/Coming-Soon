package com.asksenior.config;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1)
public class AdminKeyFilter implements Filter {

    @Value("${app.admin.key}")
    private String adminKey;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Always allow CORS pre-flight requests through
        if ("OPTIONS".equalsIgnoreCase(method)) {
            chain.doFilter(req, res);
            return;
        }

        // Protect admin stats + catalog addition + ALL list GET endpoints that expose personal data
        // Allow detail GET endpoints (/api/insider/{id} and /api/mentor/{id})
        boolean isProtected =
                path.startsWith("/api/admin") ||
                        ("POST".equals(method) && path.equals("/api/catalog/colleges")) ||
                        ("GET".equals(method) &&
                                (path.equals("/api/insider") || path.equals("/api/mentor") ||
                                 path.equals("/api/student")));

        if (isProtected) {
            String provided = request.getHeader("X-Admin-Key");
            boolean valid = provided != null &&
                    java.security.MessageDigest.isEqual(
                            provided.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                            adminKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            if (!valid) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Unauthorized - admin key required\"}");
                return;
            }
        }

        chain.doFilter(req, res);
    }
}

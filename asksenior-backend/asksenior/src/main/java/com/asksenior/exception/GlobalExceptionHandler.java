package com.asksenior.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Handles @Valid validation failures — returns clean list of field errors */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return errorResponse(HttpStatus.BAD_REQUEST, message);
    }

    /** Handles our own NotFoundException (404) */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NotFoundException ex) {
        return errorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /**
     * Handles intentional business-rule RuntimeExceptions (400 Bad Request).
     * These are thrown explicitly by service code with safe, user-facing messages.
     * Unexpected infrastructure failures (e.g., S3, DB constraint) are caught by
     * handleUnexpected below so their raw messages are never sent to the client.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        // Heuristic: if the message looks like a known business error, pass it through.
        // Otherwise, log and return a generic message so we don't leak internals.
        String msg = ex.getMessage();
        boolean isBusiness = msg != null && (
                msg.startsWith("OTP") ||
                msg.startsWith("Invalid OTP") ||
                msg.startsWith("Too many") ||
                msg.startsWith("No OTP") ||
                msg.startsWith("Must be") ||
                msg.startsWith("Edu email not verified") ||
                msg.startsWith("Work email is not verified") ||
                msg.startsWith("File too large") ||
                msg.startsWith("Invalid file") ||
                msg.startsWith("No file provided") ||
                msg.startsWith("This work email") ||
                msg.startsWith("Unknown role") ||
                msg.startsWith("Please wait")
        );
        if (isBusiness) {
            return errorResponse(HttpStatus.BAD_REQUEST, msg);
        }
        // Log the full exception for debugging — don't expose it to the client
        log.error("Unexpected runtime error: {}", msg, ex);
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.");
    }

    private ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}

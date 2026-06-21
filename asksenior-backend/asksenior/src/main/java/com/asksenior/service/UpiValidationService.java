package com.asksenior.service;

import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class UpiValidationService {

    // UPI format: handle@psp  e.g. john.doe@oksbi
    private static final Pattern UPI_PATTERN =
            Pattern.compile("^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$");

    public ValidationResult validate(String upiId) {
        if (upiId == null || upiId.isBlank())
            return new ValidationResult("FAILED", "UPI ID is required");

        String value = upiId.trim();

        if (!UPI_PATTERN.matcher(value).matches())
            return new ValidationResult("FAILED", "Invalid UPI ID format. It should look like name@bank");

        // Format passed. We mark VERIFIED for format-level validation.
        // (Real account-existence check would require a paid provider API.)
        return new ValidationResult("VERIFIED", "UPI ID format is valid");
    }

    public record ValidationResult(String status, String message) {}
}
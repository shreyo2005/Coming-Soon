package com.asksenior.service;

import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class UpiValidationService {

    // UPI format: handle@psp  e.g. john.doe@oksbi
    private static final Pattern UPI_PATTERN =
            Pattern.compile("^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$");

    // Real NPCI-recognised PSP handles (extend as needed)
    private static final Set<String> KNOWN_PSPS = Set.of(
            "oksbi", "okhdfcbank", "okicici", "okaxis",   // Google Pay
            "ybl", "ibl", "axl",                           // PhonePe
            "paytm",                                       // Paytm
            "apl", "yapl",                                 // Amazon Pay
            "upi", "axisbank", "hdfcbank", "icici", "sbi",
            "pingpay", "fbl", "idfcbank", "kotak", "indus",
            "barodampay", "cnrb", "pnb", "rbl", "dbs",
            "freecharge", "jupiteraxis", "slc", "cred", "tapicici",
            "airtel", "jio", "waaxis", "wahdfcbank", "waicici"
    );

    public ValidationResult validate(String upiId) {
        if (upiId == null || upiId.isBlank())
            return new ValidationResult("FAILED", "UPI ID is required");

        String value = upiId.trim();

        if (!UPI_PATTERN.matcher(value).matches())
            return new ValidationResult("FAILED", "Invalid UPI ID format. It should look like name@bank");

        String handle = value.substring(value.indexOf("@") + 1).toLowerCase();

        if (!KNOWN_PSPS.contains(handle))
            return new ValidationResult("FAILED",
                    "Unrecognised UPI handle '@" + handle + "'. Please double-check your UPI ID.");

        // Format + known PSP passed. We mark VERIFIED for format-level validation.
        // (Real account-existence check would require a paid provider API.)
        return new ValidationResult("VERIFIED", "UPI ID format is valid");
    }

    public record ValidationResult(String status, String message) {}
}
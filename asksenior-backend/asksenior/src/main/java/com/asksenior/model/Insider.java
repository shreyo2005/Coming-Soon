package com.asksenior.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "insiders")
public class Insider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String fullName;
    private String phone;

    private String college;
    private String course;
    private String customCourse;
    private String year;

    private String linkedInUrl;

    @Column(length = 500)
    private String bio;

    // Profile photo
    private String photoPath;

    // UPI / payout
    private String upiId;
    private String upiVerificationStatus;   // VERIFIED | PENDING | FAILED
    private LocalDateTime upiVerifiedAt;
    private String accountHolderName;

    private String collegeIdNumber;

    @Column(length = 1000)
    private String adminSummary;

    private boolean onboardingWatched = false;

    // Verification details
    private String verificationMethod;
    private String eduEmail;
    private Boolean eduEmailVerified = false;
    private String otpCode;
    private LocalDateTime otpCreatedAt;
    private Integer otpAttempts = 0;
    private String idCardPath;
    private String proofOfAdmissionPath;

    private LocalDateTime registeredAt;
}

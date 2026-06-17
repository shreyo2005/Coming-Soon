package com.asksenior.service;

import com.asksenior.dto.Dtos.*;
import com.asksenior.exception.NotFoundException;
import com.asksenior.model.Insider;
import com.asksenior.repository.InsiderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InsiderService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final InsiderRepository repo;
    private final UpiValidationService upiValidation;
    private final EmailService emailService;
    private final RateLimiterService rateLimiter;

    public InsiderService(InsiderRepository repo, UpiValidationService upiValidation,
                          EmailService emailService, RateLimiterService rateLimiter) {
        this.repo = repo;
        this.upiValidation = upiValidation;
        this.emailService = emailService;
        this.rateLimiter = rateLimiter;
    }

    public Insider auth(String email) {
        return repo.findByEmail(email).orElseGet(() -> {
            Insider i = new Insider();
            i.setEmail(email);
            return repo.save(i);
        });
    }

    public void updateCollege(Long id, InsiderCollegeRequest req) {
        Insider i = get(id);
        i.setCollege(req.getCollege());
        i.setCourse(req.getCourse());
        i.setCustomCourse("Other".equalsIgnoreCase(req.getCourse()) ? req.getCustomCourse() : null);
        i.setYear(req.getYear());
        repo.save(i);
    }

    public void updateProfile(Long id, InsiderProfileRequest req) {
        Insider i = get(id);
        i.setFullName(req.getFullName());
        i.setPhone(req.getPhone());
        i.setBio(req.getBio());
        i.setLinkedInUrl(req.getLinkedInUrl());
        repo.save(i);
    }

    public void updatePayout(Long id, InsiderPayoutRequest req) {
        // Validate UPI format before accepting
        var result = upiValidation.validate(req.getUpiId());
        if ("FAILED".equals(result.status())) {
            throw new RuntimeException(result.message());
        }
        Insider i = get(id);
        i.setUpiId(req.getUpiId());
        i.setUpiVerificationStatus(result.status());
        if ("VERIFIED".equals(result.status())) {
            i.setUpiVerifiedAt(LocalDateTime.now());
        }
        i.setCollegeIdNumber(req.getCollegeIdNumber());
        i.setAdminSummary(req.getAdminSummary());
        i.setVerificationMethod(req.getVerificationMethod());
        if ("edu_email".equals(req.getVerificationMethod())) {
            // Assume email is already verified via verifyOtp endpoint
            if (i.getEduEmailVerified() == null || !i.getEduEmailVerified() || !i.getEduEmail().equals(req.getEduEmail())) {
                throw new RuntimeException("Edu email not verified");
            }
        }
        i.setRegisteredAt(LocalDateTime.now());
        repo.save(i);
    }

    @Transactional
    public void sendOtp(Long id, String eduEmail) {
        // Rate limit: max 3 OTP sends per insider per 60 seconds
        rateLimiter.check("insider-otp:" + id, 3, 60);

        if (!eduEmail.endsWith(".edu") && !eduEmail.endsWith(".edu.in") && !eduEmail.endsWith(".ac.in")) {
            throw new RuntimeException("Must be a valid college email domain (.edu, .edu.in, .ac.in)");
        }
        Insider i = get(id);
        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        i.setEduEmail(eduEmail);
        i.setOtpCode(otp);
        i.setEduEmailVerified(false);
        i.setOtpCreatedAt(java.time.LocalDateTime.now());
        i.setOtpAttempts(0);
        repo.save(i);
        emailService.sendOtpEmail(eduEmail, otp);
    }

    public void verifyOtp(Long id, String otp) {
        Insider i = get(id);
        if (i.getOtpCode() == null)
            throw new RuntimeException("No OTP requested. Please request a new OTP.");
        if (i.getOtpCreatedAt() == null || i.getOtpCreatedAt().isBefore(java.time.LocalDateTime.now().minusMinutes(10))) {
            i.setOtpCode(null); i.setOtpCreatedAt(null); repo.save(i);
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }
        int attempts = i.getOtpAttempts() == null ? 0 : i.getOtpAttempts();
        if (attempts >= 5) {
            i.setOtpCode(null); i.setOtpCreatedAt(null); repo.save(i);
            throw new RuntimeException("Too many incorrect attempts. Please request a new OTP.");
        }
        if (!i.getOtpCode().equals(otp)) {
            i.setOtpAttempts(attempts + 1); repo.save(i);
            throw new RuntimeException("Invalid OTP. " + (4 - attempts) + " attempt(s) remaining.");
        }
        i.setEduEmailVerified(true);
        i.setOtpCode(null); i.setOtpCreatedAt(null); i.setOtpAttempts(0);
        repo.save(i);
    }

    public void saveDocument(Long id, String docType, String path) {
        Insider i = get(id);
        if ("id_card".equalsIgnoreCase(docType)) {
            i.setIdCardPath(path);
        } else if ("proof_admission".equalsIgnoreCase(docType)) {
            i.setProofOfAdmissionPath(path);
        }
        repo.save(i);
    }

    public void savePhoto(Long id, String path) {
        Insider i = get(id);
        i.setPhotoPath(path);
        repo.save(i);
    }

    public void markOnboardingWatched(Long id) {
        Insider i = get(id);
        i.setOnboardingWatched(true);
        repo.save(i);
    }

    public Insider get(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Insider not found with id " + id));
    }

    public Page<Insider> search(String q, Pageable pageable) {
        if (q == null || q.isBlank()) return repo.findAll(pageable);
        return repo.findByFullNameContainingIgnoreCaseOrCollegeContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, q, pageable);
    }

    public long count() { return repo.count(); }
    public List<Insider> all() { return repo.findAll(); }
}
package com.asksenior.service;

import com.asksenior.dto.Dtos.*;
import com.asksenior.exception.NotFoundException;
import com.asksenior.model.Mentor;
import com.asksenior.repository.MentorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MentorService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final MentorRepository repo;
    private final UpiValidationService upiValidation;
    private final EmailService emailService;
    private final RateLimiterService rateLimiter;

    public MentorService(MentorRepository repo, UpiValidationService upiValidation,
                         EmailService emailService, RateLimiterService rateLimiter) {
        this.repo = repo;
        this.upiValidation = upiValidation;
        this.emailService = emailService;
        this.rateLimiter = rateLimiter;
    }

    public Mentor auth(String email) {
        return repo.findByEmail(email).orElseGet(() -> {
            Mentor m = new Mentor();
            m.setEmail(email);
            return repo.save(m);
        });
    }

    public void updateProfile(Long id, MentorProfileRequest req) {
        // Enforce unique work email if provided
        if (req.getWorkEmail() != null && !req.getWorkEmail().isBlank()) {
            repo.findByWorkEmail(req.getWorkEmail()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new RuntimeException("This work email is already registered by another mentor");
                }
            });
        }

        Mentor m = get(id);
        m.setFullName(req.getFullName());
        m.setPhone(req.getPhone());
        m.setCompany(req.getCompany());
        m.setDesignation(req.getDesignation());
        
        // Convert blank work email to null to prevent empty string unique constraint violation
        String we = req.getWorkEmail();
        m.setWorkEmail(we != null && we.isBlank() ? null : we);

        m.setAreaOfExpertise(req.getAreaOfExpertise());
        m.setLinkedInUrl(req.getLinkedInUrl());
        m.setYearsOfExperience(req.getYearsOfExperience());
        m.setBio(req.getBio());
        m.setAdminSummary(req.getAdminSummary());
        m.setRegisteredAt(LocalDateTime.now());
        repo.save(m);
    }

    public void savePhoto(Long id, String path) {
        Mentor m = get(id);
        m.setPhotoPath(path);
        repo.save(m);
    }

    public void updatePayout(Long id, MentorPayoutRequest req) {
        Mentor m = get(id);
        
        // Only validate upi if provided
        if (req.getUpiId() != null && !req.getUpiId().isBlank()) {
            var result = upiValidation.validate(req.getUpiId());
            if ("FAILED".equals(result.status())) {
                throw new RuntimeException(result.message());
            }
            m.setUpiId(req.getUpiId());
            m.setUpiVerificationStatus(result.status());
        }
        
        m.setVerificationMethod(req.getVerificationMethod());
        m.setAdminSummary(req.getAdminSummary());

        if ("work_email".equals(req.getVerificationMethod())) {
            if (m.getWorkEmailVerified() == null || !m.getWorkEmailVerified() || !m.getWorkEmail().equals(req.getWorkEmail())) {
                throw new RuntimeException("Work email is not verified yet. Please request and verify OTP.");
            }
        }
        repo.save(m);
    }

    @Transactional
    public void sendOtp(Long id, MentorSendOtpRequest req) {
        // Rate limit: max 3 OTP sends per mentor per 60 seconds
        rateLimiter.check("mentor-otp:" + id, 3, 60);

        Mentor m = get(id);
        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        m.setOtpCode(otp);
        m.setWorkEmail(req.getWorkEmail());
        m.setWorkEmailVerified(false);
        m.setOtpCreatedAt(java.time.LocalDateTime.now());
        m.setOtpAttempts(0);
        repo.save(m);
        emailService.sendOtpEmail(req.getWorkEmail(), otp);
    }

    @Transactional
    public void verifyOtp(Long id, MentorVerifyOtpRequest req) {
        Mentor m = get(id);
        if (m.getOtpCode() == null)
            throw new RuntimeException("No OTP requested. Please request a new OTP.");
        if (m.getOtpCreatedAt() == null || m.getOtpCreatedAt().isBefore(java.time.LocalDateTime.now().minusMinutes(10))) {
            m.setOtpCode(null); m.setOtpCreatedAt(null); repo.save(m);
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }
        if (!m.getWorkEmail().equals(req.getWorkEmail()))
            throw new RuntimeException("Email mismatch");
        int attempts = m.getOtpAttempts() == null ? 0 : m.getOtpAttempts();
        if (attempts >= 5) {
            m.setOtpCode(null); m.setOtpCreatedAt(null); repo.save(m);
            throw new RuntimeException("Too many incorrect attempts. Please request a new OTP.");
        }
        if (!m.getOtpCode().equals(req.getOtp())) {
            m.setOtpAttempts(attempts + 1); repo.save(m);
            throw new RuntimeException("Invalid OTP. " + (4 - attempts) + " attempt(s) remaining.");
        }
        m.setWorkEmailVerified(true);
        m.setOtpCode(null); m.setOtpCreatedAt(null); m.setOtpAttempts(0);
        repo.save(m);
    }

    public void saveDocument(Long id, String docType, String path) {
        Mentor m = get(id);
        if ("proof_work".equalsIgnoreCase(docType)) {
            m.setProofOfWorkPath(path);
        } else if ("employee_id_card".equalsIgnoreCase(docType)) {
            m.setEmployeeIdCardPath(path);
        }
        repo.save(m);
    }

    public void markOnboardingWatched(Long id) {
        Mentor m = get(id);
        m.setOnboardingWatched(true);
        repo.save(m);
    }

    public Mentor get(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Mentor not found with id " + id));
    }

    public Page<Mentor> search(String q, Pageable pageable) {
        if (q == null || q.isBlank()) return repo.findAll(pageable);
        return repo.findByFullNameContainingIgnoreCaseOrCompanyContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, q, pageable);
    }

    public long count() { return repo.count(); }
    public List<Mentor> all() { return repo.findAll(); }
}
package com.asksenior.controller;

import com.asksenior.dto.Dtos.*;
import com.asksenior.model.Mentor;
import com.asksenior.service.MentorService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mentor")
public class MentorController {

    private final MentorService service;

    public MentorController(MentorService service) {
        this.service = service;
    }

    @PostMapping("/auth")
    public AuthResponse auth(@Valid @RequestBody AuthRequest req) {
        Mentor m = service.auth(req.getEmail());
        return new AuthResponse(m.getId(), m.getEmail(), "mentor");
    }

    @PutMapping("/{id}/profile")
    public MessageResponse profile(@PathVariable Long id, @Valid @RequestBody MentorProfileRequest req) {
        service.updateProfile(id, req);
        return new MessageResponse("Submitted for approval");
    }

    @PutMapping("/{id}/onboarding-watched")
    public MessageResponse onboarding(@PathVariable Long id) {
        service.markOnboardingWatched(id);
        return new MessageResponse("Onboarding marked complete");
    }

    @PutMapping("/{id}/payout")
    public MessageResponse payout(@PathVariable Long id, @Valid @RequestBody MentorPayoutRequest req) {
        service.updatePayout(id, req);
        return new MessageResponse("Payout and verification saved");
    }

    @PostMapping("/{id}/send-otp")
    public MessageResponse sendOtp(@PathVariable Long id, @Valid @RequestBody MentorSendOtpRequest req) {
        service.sendOtp(id, req);
        return new MessageResponse("OTP sent to " + req.getWorkEmail());
    }

    @PostMapping("/{id}/verify-otp")
    public MessageResponse verifyOtp(@PathVariable Long id, @Valid @RequestBody MentorVerifyOtpRequest req) {
        service.verifyOtp(id, req);
        return new MessageResponse("Email verified successfully");
    }

    @GetMapping("/{id}")
    public Mentor get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping
    public Page<Mentor> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.search(q, PageRequest.of(page, size));
    }
}
package com.asksenior.controller;

import com.asksenior.dto.Dtos.*;
import com.asksenior.model.Insider;
import com.asksenior.service.InsiderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/insider")
public class InsiderController {

    private final InsiderService service;

    public InsiderController(InsiderService service) {
        this.service = service;
    }

    @PostMapping("/auth")
    public AuthResponse auth(@Valid @RequestBody AuthRequest req) {
        Insider i = service.auth(req.getEmail());
        return new AuthResponse(i.getId(), i.getEmail(), "insider");
    }

    @PutMapping("/{id}/college")
    public MessageResponse college(@PathVariable Long id, @Valid @RequestBody InsiderCollegeRequest req) {
        service.updateCollege(id, req);
        return new MessageResponse("College info saved");
    }

    @PutMapping("/{id}/profile")
    public MessageResponse profile(@PathVariable Long id, @Valid @RequestBody InsiderProfileRequest req) {
        service.updateProfile(id, req);
        return new MessageResponse("Profile saved");
    }

    @PutMapping("/{id}/payout")
    public MessageResponse payout(@PathVariable Long id, @Valid @RequestBody InsiderPayoutRequest req) {
        service.updatePayout(id, req);
        return new MessageResponse("Submitted for approval");
    }

    @PutMapping("/{id}/onboarding-watched")
    public MessageResponse onboarding(@PathVariable Long id) {
        service.markOnboardingWatched(id);
        return new MessageResponse("Onboarding marked complete");
    }

    @GetMapping("/{id}")
    public Insider get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping
    public Page<Insider> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.search(q, PageRequest.of(page, size));
    }
}
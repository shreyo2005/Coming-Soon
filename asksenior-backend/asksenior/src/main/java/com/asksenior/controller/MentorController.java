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
package com.asksenior.service;

import com.asksenior.dto.Dtos.*;
import com.asksenior.exception.NotFoundException;
import com.asksenior.model.Mentor;
import com.asksenior.repository.MentorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MentorService {

    private final MentorRepository repo;

    public MentorService(MentorRepository repo) {
        this.repo = repo;
    }

    public Mentor auth(String email) {
        return repo.findByEmail(email).orElseGet(() -> {
            Mentor m = new Mentor();
            m.setEmail(email);
            return repo.save(m);
        });
    }

    public void updateProfile(Long id, MentorProfileRequest req) {
        // Enforce unique work email (mandatory field validated at DTO level)
        repo.findByWorkEmail(req.getWorkEmail()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new RuntimeException("This work email is already registered by another mentor");
            }
        });

        Mentor m = get(id);
        m.setFullName(req.getFullName());
        m.setPhone(req.getPhone());
        m.setCompany(req.getCompany());
        m.setDesignation(req.getDesignation());
        m.setWorkEmail(req.getWorkEmail());
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
package com.asksenior.controller;

import com.asksenior.dto.Dtos.*;
import com.asksenior.model.Student;
import com.asksenior.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    @PostMapping("/auth")
    public AuthResponse auth(@Valid @RequestBody AuthRequest req) {
        Student s = service.auth(req.getEmail());
        return new AuthResponse(s.getId(), s.getEmail(), "student");
    }

    @PutMapping("/{id}/profile")
    public MessageResponse profile(@PathVariable Long id, @Valid @RequestBody StudentProfileRequest req) {
        service.updateProfile(id, req);
        return new MessageResponse("Registration complete");
    }

    @GetMapping("/{id}")
    public Student get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping
    public Page<Student> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.search(q, PageRequest.of(page, size));
    }
}
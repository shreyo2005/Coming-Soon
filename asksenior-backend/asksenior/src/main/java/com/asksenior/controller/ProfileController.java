package com.asksenior.controller;

import com.asksenior.dto.Dtos.*;
import com.asksenior.service.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final FileStorageService fileStorage;
    private final UpiValidationService upiValidation;
    private final StudentService studentService;
    private final MentorService mentorService;
    private final InsiderService insiderService;

    public ProfileController(FileStorageService fileStorage, UpiValidationService upiValidation,
                             StudentService studentService, MentorService mentorService,
                             InsiderService insiderService) {
        this.fileStorage = fileStorage;
        this.upiValidation = upiValidation;
        this.studentService = studentService;
        this.mentorService = mentorService;
        this.insiderService = insiderService;
    }

    @PostMapping("/upload-photo")
    public UploadResponse uploadPhoto(
            @RequestParam String role,
            @RequestParam Long id,
            @RequestParam("file") MultipartFile file) {
        String path = fileStorage.storeImage(file, role + "_" + id + "_photo");
        savePhoto(role, id, path);
        return new UploadResponse("Photo uploaded successfully", path);
    }

    @PostMapping("/upload-webcam-image")
    public UploadResponse uploadWebcam(
            @RequestParam String role,
            @RequestParam Long id,
            @RequestParam("file") MultipartFile file) {
        String path = fileStorage.storeImage(file, role + "_" + id + "_webcam");
        savePhoto(role, id, path);
        return new UploadResponse("Webcam photo uploaded successfully", path);
    }

    @PostMapping("/verify-upi")
    public UpiResponse verifyUpi(@Valid @RequestBody UpiRequest req) {
        var result = upiValidation.validate(req.getUpiId());
        return new UpiResponse(req.getUpiId(), result.status(), null, result.message());
    }

    private void savePhoto(String role, Long id, String path) {
        switch (role.toLowerCase()) {
            case "student" -> studentService.savePhoto(id, path);
            case "mentor"  -> mentorService.savePhoto(id, path);
            case "insider" -> insiderService.savePhoto(id, path);
            default -> throw new RuntimeException("Unknown role: " + role);
        }
    }
}
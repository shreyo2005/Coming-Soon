package com.asksenior.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png");

    /**
     * Validates and stores an image file. Returns the stored relative path.
     * prefix example: "student_12_photo"
     */
    public String storeImage(MultipartFile file, String prefix) {
        if (file == null || file.isEmpty())
            throw new RuntimeException("No file provided");

        if (file.getSize() > MAX_SIZE)
            throw new RuntimeException("File too large. Maximum size is 5 MB");

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase()))
            throw new RuntimeException("Invalid file type. Only JPG, JPEG and PNG are allowed");

        // Validate + sanitize extension
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = "";
        if (original.contains(".")) {
            ext = original.substring(original.lastIndexOf(".") + 1).toLowerCase();
        }
        if (!ALLOWED_EXT.contains(ext))
            throw new RuntimeException("Invalid file extension. Only .jpg, .jpeg, .png allowed");

        // Build a safe filename — never trust the user's filename
        String safeName = prefix + "_" + UUID.randomUUID().toString().substring(0, 12) + "." + ext;

        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path target = dir.resolve(safeName).normalize();

            // Path-traversal guard
            if (!target.getParent().equals(dir))
                throw new RuntimeException("Invalid storage path");

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }

        // Stored path saved in DB; served via /uploads/** (see WebConfig)
        return "/uploads/" + safeName;
    }
}
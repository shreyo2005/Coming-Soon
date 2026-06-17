package com.asksenior.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "pdf");
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", 
            "application/pdf");

    public FileStorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public String storeImage(MultipartFile file, String prefix) {
        if (file == null || file.isEmpty())
            throw new RuntimeException("No file provided");

        if (file.getSize() > MAX_SIZE)
            throw new RuntimeException("File too large. Maximum size is 5 MB");

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase()))
            throw new RuntimeException("Invalid file type. Only JPG, PNG, and PDF are allowed");

        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = "";
        if (original.contains(".")) {
            ext = original.substring(original.lastIndexOf(".") + 1).toLowerCase();
        }
        if (!ALLOWED_EXT.contains(ext))
            throw new RuntimeException("Invalid file extension. Only .jpg, .jpeg, .png, .pdf allowed");

        String safeName = prefix + "_" + UUID.randomUUID().toString().substring(0, 12) + "." + ext;

        try {
            PutObjectRequest putOb = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(safeName)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putOb, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload to S3: " + e.getMessage());
        }

        // Return the API path so frontend can fetch it and get redirected to the presigned URL
        return "/api/files/" + safeName;
    }
}
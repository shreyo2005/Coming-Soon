package com.asksenior.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String fullName;
    private String phone;

    private String college;
    private String course;
    private String customCourse;
    private String year;
    private String city;
    private String linkedInUrl;

    // College email — OPTIONAL for students
    private String collegeEmail;

    // Profile photo (path on disk, served via /uploads/**)
    private String photoPath;

    // UPI fields
    private String upiId;
    private String upiVerificationStatus;   // VERIFIED | PENDING | FAILED
    private LocalDateTime upiVerifiedAt;
    private String accountHolderName;

    private LocalDateTime registeredAt;
}
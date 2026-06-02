package com.asksenior.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "mentors")
public class Mentor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String fullName;
    private String phone;

    private String company;
    private String designation;
    private String areaOfExpertise;
    private String linkedInUrl;
    private Integer yearsOfExperience;

    @Column(length = 500)
    private String bio;

    // Work email — MANDATORY and UNIQUE for mentors
    @Column(unique = true)
    private String workEmail;

    // Profile photo
    private String photoPath;

    @Column(length = 1000)
    private String adminSummary;

    private boolean onboardingWatched = false;

    private LocalDateTime registeredAt;
}
package com.asksenior.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;

public class Dtos {

    @Data
    public static class AuthRequest {
        @Email(message = "Please provide a valid email")
        @NotBlank(message = "Email is required")
        private String email;
    }

    @Data
    @AllArgsConstructor
    public static class AuthResponse {
        private Long id;
        private String email;
        private String role;
    }

    // ---- Insider (current student) ----
    @Data
    public static class InsiderCollegeRequest {
        @NotBlank private String college;
        @NotBlank private String course;
        private String customCourse;
        @NotBlank private String year;
    }

    @Data
    public static class InsiderProfileRequest {
        @NotBlank(message = "Full name is required")
        private String fullName;

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^(\\+91)?[6-9][0-9]{9}$",
                message = "Enter a valid 10-digit Indian mobile number")
        private String phone;

        private String bio;
        private String linkedInUrl;
    }

    @Data
    public static class InsiderPayoutRequest {
        @NotBlank private String upiId;
        private String collegeIdNumber;
        private String adminSummary;
        @NotBlank private String verificationMethod;
        private String eduEmail;
    }

    // ---- Mentor (professional) ----

    public static class MentorPayoutRequest {
        @NotBlank private String upiId;
        private String adminSummary;
        @NotBlank private String verificationMethod;
        private String workEmail; // For otp flow

        public String getUpiId() { return upiId; }
        public void setUpiId(String upiId) { this.upiId = upiId; }
        public String getAdminSummary() { return adminSummary; }
        public void setAdminSummary(String adminSummary) { this.adminSummary = adminSummary; }
        public String getVerificationMethod() { return verificationMethod; }
        public void setVerificationMethod(String verificationMethod) { this.verificationMethod = verificationMethod; }
        public String getWorkEmail() { return workEmail; }
        public void setWorkEmail(String workEmail) { this.workEmail = workEmail; }
    }

    public static class MentorSendOtpRequest {
        @NotBlank private String workEmail;
        public String getWorkEmail() { return workEmail; }
        public void setWorkEmail(String workEmail) { this.workEmail = workEmail; }
    }

    public static class MentorVerifyOtpRequest {
        @NotBlank private String workEmail;
        @NotBlank private String otp;
        public String getWorkEmail() { return workEmail; }
        public void setWorkEmail(String workEmail) { this.workEmail = workEmail; }
        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
    }

    @Data
    public static class MentorProfileRequest {
        @NotBlank(message = "Full name is required")
        private String fullName;

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^(\\+91)?[6-9][0-9]{9}$",
                message = "Enter a valid 10-digit Indian mobile number")
        private String phone;

        @NotBlank(message = "Company is required")
        private String company;

        @NotBlank(message = "Designation is required")
        private String designation;

        // Optional because mentors can verify using ID Card instead of Work Email
        private String workEmail;

        @NotBlank(message = "LinkedIn profile is required")
        @Pattern(regexp = ".*linkedin\\.com.*",
                message = "Please provide a valid LinkedIn URL")
        private String linkedInUrl;

        private String areaOfExpertise;
        private Integer yearsOfExperience;
        private String bio;
        private String adminSummary;
    }

    // ---- Student (seeker) ----
    @Data
    public static class StudentProfileRequest {
        @NotBlank(message = "Full name is required")
        private String fullName;

        private String phone;

        private String college;

        private String course;

        private String customCourse;
        private String year;
        private String city;

        @Email(message = "Please provide a valid college email")
        private String collegeEmail;

        private String linkedInUrl;
    }

    // ---- UPI verification ----
    @Data
    public static class UpiRequest {
        @NotBlank private String upiId;
    }

    @Data
    public static class SendOtpRequest {
        @NotBlank @Email private String eduEmail;
    }

    @Data
    public static class VerifyOtpRequest {
        @NotBlank private String otp;
    }

    @Data
    @AllArgsConstructor
    public static class UpiResponse {
        private String upiId;
        private String status;
        private String accountHolderName;
        private String message;
    }

    @Data
    @AllArgsConstructor
    public static class MessageResponse {
        private String message;
    }

    @Data
    @AllArgsConstructor
    public static class UploadResponse {
        private String message;
        private String path;
    }

    @Data
    public static class CollegeRequest {
        @NotBlank private String name;
        private String city;
        private String state;
    }
}
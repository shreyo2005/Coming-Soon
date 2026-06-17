-- V2: Add OTP security columns to insiders and mentors
-- Adds expiry tracking and brute-force protection

ALTER TABLE insiders
    ADD COLUMN IF NOT EXISTS otp_created_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS otp_attempts    INTEGER DEFAULT 0;

ALTER TABLE mentors
    ADD COLUMN IF NOT EXISTS otp_created_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS otp_attempts    INTEGER DEFAULT 0;

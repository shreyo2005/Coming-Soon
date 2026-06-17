package com.asksenior.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${spring.mail.password}")
    private String resendApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            String htmlMsg =
                "<div style='font-family:\"DM Sans\",Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#F5F0E8;border-radius:16px;'>" +
                "  <div style='text-align:center;margin-bottom:28px;'>" +
                "    <span style='font-size:28px;font-weight:900;color:#2D1B00;letter-spacing:-1px;'>OG</span>" +
                "    <span style='font-size:28px;font-weight:900;color:#D97706;letter-spacing:-1px;'>Senior</span>" +
                "  </div>" +
                "  <h2 style='font-size:18px;font-weight:700;color:#1A120A;margin:0 0 8px;text-align:center;'>Verify your email</h2>" +
                "  <p style='font-size:14px;color:rgba(60,40,15,0.6);text-align:center;margin:0 0 28px;line-height:1.6;'>Use the code below to complete your OG Senior registration. This code expires in <strong>10 minutes</strong>.</p>" +
                "  <div style='background:#fff;border:1.5px solid rgba(180,140,60,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;'>" +
                "    <span style='font-size:42px;font-weight:800;letter-spacing:12px;color:#B45309;font-family:monospace;'>" + otp + "</span>" +
                "  </div>" +
                "  <p style='font-size:12px;color:rgba(60,40,15,0.45);text-align:center;margin:0;'>Never share this code with anyone. OG Senior will never ask for it.<br/>If you didn't request this, you can safely ignore this email.</p>" +
                "  <hr style='border:none;border-top:1px solid rgba(180,140,60,0.12);margin:24px 0;'/>" +
                "  <p style='font-size:11px;color:rgba(60,40,15,0.35);text-align:center;margin:0;'>© 2026 OG Senior · <a href='https://ogsenior.com' style='color:#D97706;text-decoration:none;'>ogsenior.com</a></p>" +
                "</div>";

            Map<String, Object> requestParams = new HashMap<>();
            requestParams.put("from", "OG Senior <support@ogsenior.com>");
            requestParams.put("to", List.of(toEmail));
            requestParams.put("subject", "Your OG Senior Verification Code — " + otp);
            requestParams.put("html", htmlMsg);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestParams, headers);

            restTemplate.postForEntity("https://api.resend.com/emails", request, String.class);
            log.info("OTP email sent successfully to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send OTP email via Resend API to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send OTP email. Please verify your Resend configuration.");
        }
    }
}

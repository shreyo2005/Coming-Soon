package com.asksenior.repository;

import com.asksenior.model.Mentor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MentorRepository extends JpaRepository<Mentor, Long> {
    Optional<Mentor> findByEmail(String email);
    Optional<Mentor> findByWorkEmail(String workEmail);
    Page<Mentor> findByFullNameContainingIgnoreCaseOrCompanyContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name, String company, String email, Pageable pageable);
}
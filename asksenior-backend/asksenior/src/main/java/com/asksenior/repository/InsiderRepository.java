package com.asksenior.repository;

import com.asksenior.model.Insider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InsiderRepository extends JpaRepository<Insider, Long> {
    Optional<Insider> findByEmail(String email);
    Page<Insider> findByFullNameContainingIgnoreCaseOrCollegeContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name, String college, String email, Pageable pageable);
}
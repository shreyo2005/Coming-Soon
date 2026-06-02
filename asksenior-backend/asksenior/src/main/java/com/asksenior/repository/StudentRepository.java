package com.asksenior.repository;


import com.asksenior.model.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByEmail(String email);
    Page<Student> findByFullNameContainingIgnoreCaseOrCollegeContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name, String college, String email, Pageable pageable);
}
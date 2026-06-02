package com.asksenior.repository;

import com.asksenior.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {
    boolean existsByNameIgnoreCase(String name);
}
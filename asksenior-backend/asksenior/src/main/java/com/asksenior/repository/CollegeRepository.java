package com.asksenior.repository;

import com.asksenior.model.College;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CollegeRepository extends JpaRepository<College, Long> {
    List<College> findByNameContainingIgnoreCaseOrderByName(String name);
    boolean existsByNameIgnoreCase(String name);
}

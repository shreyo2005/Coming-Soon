package com.asksenior.controller;

import com.asksenior.dto.Dtos.CollegeRequest;
import com.asksenior.model.College;
import com.asksenior.model.Course;
import com.asksenior.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {

    private final CatalogService service;

    public CatalogController(CatalogService service) {
        this.service = service;
    }

    @GetMapping("/colleges")
    public List<College> colleges(@RequestParam(required = false) String q) {
        return service.searchColleges(q);
    }

    @PostMapping("/colleges")
    public College addCollege(@Valid @RequestBody CollegeRequest req) {
        return service.addCollege(req);
    }

    @GetMapping("/courses")
    public List<Course> courses() {
        return service.allCourses();
    }
}
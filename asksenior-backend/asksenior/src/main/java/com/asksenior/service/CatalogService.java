package com.asksenior.service;

import com.asksenior.dto.Dtos.CollegeRequest;
import com.asksenior.model.College;
import com.asksenior.model.Course;
import com.asksenior.repository.CollegeRepository;
import com.asksenior.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CatalogService {

    private final CollegeRepository collegeRepo;
    private final CourseRepository courseRepo;

    public CatalogService(CollegeRepository collegeRepo, CourseRepository courseRepo) {
        this.collegeRepo = collegeRepo;
        this.courseRepo = courseRepo;
    }

    //returning all the colleges
    public List<College> allColleges() {
        return collegeRepo.findAll();
    }

    public List<College> searchColleges(String q) {
        if (q == null || q.isBlank()) return collegeRepo.findAll();
        return collegeRepo.findByNameContainingIgnoreCaseOrderByName(q);
    }

    public College addCollege(CollegeRequest req) {
        if (collegeRepo.existsByNameIgnoreCase(req.getName())) {
            throw new RuntimeException("College already exists: " + req.getName());
        }
        College c = new College();
        c.setName(req.getName());
        c.setCity(req.getCity());
        c.setState(req.getState());
        return collegeRepo.save(c);
    }


    public boolean isValidCollege(String name) {
        return collegeRepo.existsByNameIgnoreCase(name);
    }

  //for the courses ill need this
    public List<Course> allCourses() {
        return courseRepo.findAll();
    }
}

package com.asksenior.controller;

import com.asksenior.model.Insider;
import com.asksenior.model.Mentor;
import com.asksenior.model.Student;
import com.asksenior.service.InsiderService;
import com.asksenior.service.MentorService;
import com.asksenior.service.StudentService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final InsiderService insiderService;
    private final MentorService mentorService;
    private final StudentService studentService;

    public AdminController(InsiderService insiderService, MentorService mentorService, StudentService studentService) {
        this.insiderService = insiderService;
        this.mentorService = mentorService;
        this.studentService = studentService;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Object> out = new LinkedHashMap<>();

        out.put("totalStudents", studentService.count());
        out.put("totalMentors", mentorService.count());
        out.put("totalInsiders", insiderService.count());

        List<Student> students = studentService.all();
        List<Mentor> mentors = mentorService.all();
        List<Insider> insiders = insiderService.all();

        out.put("studentsByCollege", countBy(students, Student::getCollege));
        out.put("studentsByCourse", countBy(students, s ->
                "Other".equalsIgnoreCase(s.getCourse()) ? s.getCustomCourse() : s.getCourse()));
        out.put("mentorsByDomain", countBy(mentors, Mentor::getAreaOfExpertise));
        out.put("insidersByCollege", countBy(insiders, Insider::getCollege));

        out.put("recentStudents", recent(students, Student::getRegisteredAt, Student::getFullName, Student::getEmail));
        out.put("recentMentors", recent(mentors, Mentor::getRegisteredAt, Mentor::getFullName, Mentor::getEmail));
        out.put("recentInsiders", recent(insiders, Insider::getRegisteredAt, Insider::getFullName, Insider::getEmail));

        return out;
    }

    private <T> Map<String, Long> countBy(List<T> list, java.util.function.Function<T, String> key) {
        return list.stream()
                .map(key)
                .filter(Objects::nonNull)
                .filter(v -> !v.isBlank())
                .collect(Collectors.groupingBy(v -> v, LinkedHashMap::new, Collectors.counting()));
    }

    private <T> List<Map<String, String>> recent(
            List<T> list,
            java.util.function.Function<T, LocalDateTime> dateFn,
            java.util.function.Function<T, String> nameFn,
            java.util.function.Function<T, String> emailFn) {
        return list.stream()
                .filter(t -> dateFn.apply(t) != null)
                .sorted(Comparator.comparing(dateFn).reversed())
                .limit(5)
                .map(t -> {
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("name", nameFn.apply(t) == null ? "-" : nameFn.apply(t));
                    m.put("email", emailFn.apply(t));
                    m.put("date", dateFn.apply(t).toString());
                    return m;
                })
                .collect(Collectors.toList());
    }
}
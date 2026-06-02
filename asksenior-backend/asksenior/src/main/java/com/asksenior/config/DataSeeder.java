package com.asksenior.config;

import com.asksenior.model.College;
import com.asksenior.model.Course;
import com.asksenior.repository.CollegeRepository;
import com.asksenior.repository.CourseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final CollegeRepository collegeRepo;
    private final CourseRepository courseRepo;

    public DataSeeder(CollegeRepository collegeRepo, CourseRepository courseRepo) {
        this.collegeRepo = collegeRepo;
        this.courseRepo = courseRepo;
    }

    @Override
    public void run(String... args) {
        if (collegeRepo.count() == 0) {
            List<String[]> colleges = List.of(
                    new String[]{"Indian Institute of Technology Bombay", "Mumbai", "Maharashtra"},
                    new String[]{"Indian Institute of Technology Delhi", "New Delhi", "Delhi"},
                    new String[]{"Indian Institute of Technology Madras", "Chennai", "Tamil Nadu"},
                    new String[]{"Indian Institute of Technology Kanpur", "Kanpur", "Uttar Pradesh"},
                    new String[]{"Indian Institute of Technology Kharagpur", "Kharagpur", "West Bengal"},
                    new String[]{"Indian Institute of Technology Roorkee", "Roorkee", "Uttarakhand"},
                    new String[]{"Indian Institute of Technology Guwahati", "Guwahati", "Assam"},
                    new String[]{"Indian Institute of Technology Hyderabad", "Hyderabad", "Telangana"},
                    new String[]{"BITS Pilani", "Pilani", "Rajasthan"},
                    new String[]{"Vellore Institute of Technology", "Vellore", "Tamil Nadu"},
                    new String[]{"National Institute of Technology Trichy", "Tiruchirappalli", "Tamil Nadu"},
                    new String[]{"National Institute of Technology Surathkal", "Mangalore", "Karnataka"},
                    new String[]{"National Institute of Technology Warangal", "Warangal", "Telangana"},
                    new String[]{"Delhi Technological University", "New Delhi", "Delhi"},
                    new String[]{"Netaji Subhas University of Technology", "New Delhi", "Delhi"},
                    new String[]{"RV College of Engineering", "Bengaluru", "Karnataka"},
                    new String[]{"PES University", "Bengaluru", "Karnataka"},
                    new String[]{"BMS College of Engineering", "Bengaluru", "Karnataka"},
                    new String[]{"Manipal Institute of Technology", "Manipal", "Karnataka"},
                    new String[]{"SRM Institute of Science and Technology", "Chennai", "Tamil Nadu"},
                    new String[]{"Birla Institute of Technology Mesra", "Ranchi", "Jharkhand"},
                    new String[]{"Indian Institute of Science", "Bengaluru", "Karnataka"},
                    new String[]{"Anna University", "Chennai", "Tamil Nadu"},
                    new String[]{"Jadavpur University", "Kolkata", "West Bengal"},
                    new String[]{"College of Engineering Pune", "Pune", "Maharashtra"},
                    new String[]{"Veermata Jijabai Technological Institute", "Mumbai", "Maharashtra"},
                    new String[]{"Thapar Institute of Engineering and Technology", "Patiala", "Punjab"},
                    new String[]{"Amrita Vishwa Vidyapeetham", "Coimbatore", "Tamil Nadu"},
                    new String[]{"Indian Institute of Information Technology Hyderabad", "Hyderabad", "Telangana"},
                    new String[]{"Christ University", "Bengaluru", "Karnataka"},
                    new String[]{"Delhi University", "New Delhi", "Delhi"},
                    new String[]{"Jawaharlal Nehru University", "New Delhi", "Delhi"},
                    new String[]{"Banaras Hindu University", "Varanasi", "Uttar Pradesh"},
                    new String[]{"Symbiosis International University", "Pune", "Maharashtra"},
                    new String[]{"Amity University", "Noida", "Uttar Pradesh"},
                    new String[]{"Lovely Professional University", "Phagwara", "Punjab"},
                    new String[]{"All India Institute of Medical Sciences Delhi", "New Delhi", "Delhi"},
                    new String[]{"Christian Medical College", "Vellore", "Tamil Nadu"},
                    new String[]{"Armed Forces Medical College", "Pune", "Maharashtra"},
                    new String[]{"St. Stephen's College", "New Delhi", "Delhi"},
                    new String[]{"Lady Shri Ram College", "New Delhi", "Delhi"},
                    new String[]{"Loyola College", "Chennai", "Tamil Nadu"},
                    new String[]{"Shri Ram College of Commerce", "New Delhi", "Delhi"},
                    new String[]{"Hindu College", "New Delhi", "Delhi"},
                    new String[]{"Indian Statistical Institute", "Kolkata", "West Bengal"},
                    new String[]{"Indian Institute of Management Ahmedabad", "Ahmedabad", "Gujarat"},
                    new String[]{"Indian Institute of Management Bangalore", "Bengaluru", "Karnataka"},
                    new String[]{"Indian Institute of Management Calcutta", "Kolkata", "West Bengal"},
                    new String[]{"National Law School of India University", "Bengaluru", "Karnataka"},
                    new String[]{"Other / Not Listed", "", ""}
            );
            for (String[] c : colleges) {
                College col = new College();
                col.setName(c[0]);
                col.setCity(c[1].isEmpty() ? null : c[1]);
                col.setState(c[2].isEmpty() ? null : c[2]);
                collegeRepo.save(col);
            }
        }

        if (courseRepo.count() == 0) {
            List<String> courses = List.of(
                    "Computer Science Engineering",
                    "Information Technology",
                    "Electronics & Communication Engineering",
                    "Electrical Engineering",
                    "Mechanical Engineering",
                    "Civil Engineering",
                    "Chemical Engineering",
                    "Aerospace Engineering",
                    "Biotechnology",
                    "Data Science & AI",
                    "MBBS",
                    "B.Com",
                    "B.A. Economics",
                    "B.Sc Physics",
                    "B.Sc Mathematics",
                    "BBA",
                    "B.Arch",
                    "Law (BA LLB)",
                    "Other"
            );
            for (String name : courses) {
                Course c = new Course();
                c.setName(name);
                courseRepo.save(c);
            }
        }
    }
}
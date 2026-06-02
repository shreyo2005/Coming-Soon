package com.asksenior.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "colleges")
public class College {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String name;
    private String city;
    private String state;
}

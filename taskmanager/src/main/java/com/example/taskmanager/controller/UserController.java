package com.example.taskmanager.controller;

import com.example.taskmanager.model.User;
import com.example.taskmanager.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    @Autowired
    private UserService userService;

    // @PostMapping("/register")
    // public ResponseEntity<?> registerUser(@RequestBody User user) {
    //     try {
    //         User savedUser = userService.registerUser(user);
    //         return ResponseEntity.ok(savedUser);
    //     } catch (RuntimeException ex) {
    //         return ResponseEntity.badRequest().body(ex.getMessage());
    //     }
    // }
}

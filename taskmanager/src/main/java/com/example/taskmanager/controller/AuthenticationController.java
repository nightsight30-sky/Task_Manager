package com.example.taskmanager.controller;

import com.example.taskmanager.dto.*;
import com.example.taskmanager.config.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private com.example.taskmanager.service.CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    // Check if user exists
    if (userDetailsService.existsByUsernameOrEmail(request.getUsername(), request.getEmail())) {
        return ResponseEntity.badRequest().body("Username or Email already exists");
    }

    // Create new user
    User user = new User();
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setRole(Role.valueOf(request.getRole().toUpperCase()));

    // Save user
    userDetailsService.save(user);  // This method must be implemented in your service

    return ResponseEntity.ok("User registered successfully");
}


    @PostMapping("/login")
    public AuthenticationResponse login(@RequestBody AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()
                )
        );

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        final String jwt = jwtService.generateToken(userDetails);

        return new AuthenticationResponse(jwt);
    }
}

package art.moor.ariadna.controller;

import art.moor.ariadna.config.security.AuthService;
import art.moor.ariadna.data.dto.auth.AuthResponseDto;
import art.moor.ariadna.data.dto.auth.LoginRequestDto;
import art.moor.ariadna.data.dto.user.UserCreateRequestDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;
import art.moor.ariadna.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(
            @Valid @RequestBody UserCreateRequestDto request,
            UriComponentsBuilder uriBuilder
    ) {
        UserResponseDto created = userService.createUser(request);
        URI location = uriBuilder.path("/api/user/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(
            @Valid @RequestBody LoginRequestDto login
    ) {
        AuthResponseDto loginResult = authService.login(login);
        return ResponseEntity.ok(loginResult);
    }
}

package art.moor.ariadna.controller;

import art.moor.ariadna.config.security.AuthRateLimiter;
import art.moor.ariadna.config.security.AuthService;
import art.moor.ariadna.config.security.RefreshCookieFactory;
import art.moor.ariadna.config.security.TokenPair;
import art.moor.ariadna.data.dto.auth.AuthResponseDto;
import art.moor.ariadna.data.dto.auth.LoginRequestDto;
import art.moor.ariadna.data.dto.user.UserCreateRequestDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;
import art.moor.ariadna.exception.InvalidRefreshTokenException;
import art.moor.ariadna.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
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
    private final RefreshCookieFactory refreshCookieFactory;
    private final AuthRateLimiter authRateLimiter;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(
            @Valid @RequestBody UserCreateRequestDto request,
            UriComponentsBuilder uriBuilder,
            HttpServletRequest httpRequest
    ) {
        authRateLimiter.checkRegister(httpRequest.getRemoteAddr());

        UserResponseDto created = userService.createUser(request);
        URI location = uriBuilder.path("/api/user/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(
            @Valid @RequestBody LoginRequestDto login,
            HttpServletRequest httpRequest
    ) {
        authRateLimiter.checkLogin(httpRequest.getRemoteAddr(), login.email());

        TokenPair tokens = authService.login(login);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookieFactory.build(tokens.refreshToken()).toString())
                .body(new AuthResponseDto(tokens.accessToken()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDto> refresh(
            @CookieValue(name = RefreshCookieFactory.COOKIE_NAME, required = false) String refreshToken
    ) {
        if (refreshToken == null) {
            throw new InvalidRefreshTokenException();
        }

        TokenPair tokens = authService.refresh(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookieFactory.build(tokens.refreshToken()).toString())
                .body(new AuthResponseDto(tokens.accessToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = RefreshCookieFactory.COOKIE_NAME, required = false) String refreshToken
    ) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookieFactory.clear().toString())
                .build();
    }
}

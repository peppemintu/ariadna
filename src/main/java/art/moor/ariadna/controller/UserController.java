package art.moor.ariadna.controller;

import art.moor.ariadna.config.security.UserAccessGuard;
import art.moor.ariadna.data.dto.user.UserUpdateRequestDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;
import art.moor.ariadna.data.model.UserRole;
import art.moor.ariadna.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserAccessGuard userAccessGuard;

    @GetMapping("/me")
    public UserResponseDto getMe(@AuthenticationPrincipal UserDetails userDetails) {
        return userService.getMe(userDetails.getUsername());
    }

    @GetMapping("/{id}")
    public UserResponseDto getById(@PathVariable UUID id) {
        return userService.getById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<UserResponseDto> getAll() {
        return userService.getAll();
    }

    @PutMapping("/{id}")
    public UserResponseDto update(@PathVariable UUID id,
                                  @Valid @RequestBody UserUpdateRequestDto request) {
        userAccessGuard.checkCanAccess(id);
        return userService.update(id, request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/role/{id}")
    public UserResponseDto updateRole(@PathVariable UUID id,
                                  @Valid @RequestParam UserRole role) {
        return userService.updateRole(id, role);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userAccessGuard.checkCanAccess(id);
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
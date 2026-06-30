package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.user.UserCreateRequestDto;
import art.moor.ariadna.data.dto.user.UserUpdateRequestDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;
import art.moor.ariadna.data.model.UserRole;
import art.moor.ariadna.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponseDto> create(
            @Valid @RequestBody UserCreateRequestDto request,
            UriComponentsBuilder uriBuilder
    ) {
        UserResponseDto created = userService.createUser(request);
        URI location = uriBuilder.path("/api/user/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{id}")
    public UserResponseDto getById(@PathVariable UUID id) {
        return userService.getById(id);
    }

    @GetMapping
    public List<UserResponseDto> getAll() {
        return userService.getAll();
    }

    @PutMapping("/{id}")
    public UserResponseDto update(@PathVariable UUID id,
                                  @Valid @RequestBody UserUpdateRequestDto request) {
        return userService.update(id, request);
    }

    @PutMapping("/role/{id}")
    public UserResponseDto updateRole(@PathVariable UUID id,
                                  @Valid @RequestParam UserRole role) {
        return userService.updateRole(id, role);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
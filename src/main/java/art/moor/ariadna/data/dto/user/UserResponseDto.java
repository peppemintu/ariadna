package art.moor.ariadna.domain.dto.user;

import art.moor.ariadna.domain.model.UserRole;

import java.util.UUID;

public record UserResponseDto(
        UUID id,
        String email,
        String name,
        UserRole role
) {}

package art.moor.ariadna.data.dto.user;

import art.moor.ariadna.data.model.UserRole;

import java.util.UUID;

public record UserResponseDto(
        UUID id,
        String email,
        String name,
        UserRole role
) {}

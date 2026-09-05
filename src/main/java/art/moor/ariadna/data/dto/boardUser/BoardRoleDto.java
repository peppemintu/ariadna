package art.moor.ariadna.data.dto.boardUser;

import art.moor.ariadna.data.model.BoardPermission;

import java.util.Set;

public record BoardRoleDto(
        String name,
        Set<BoardPermission> permissions
) {}

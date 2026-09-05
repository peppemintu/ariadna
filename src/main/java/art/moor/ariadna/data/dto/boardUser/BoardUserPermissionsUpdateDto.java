package art.moor.ariadna.data.dto.boardUser;

import art.moor.ariadna.data.model.BoardPermission;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record BoardUserPermissionsUpdateDto(
        @NotNull Set<BoardPermission> permissions
) {}

package art.moor.ariadna.data.dto.board;

import art.moor.ariadna.data.model.BoardPermission;

import java.util.Set;

public record BoardMyAccessDto(
        boolean owner,
        Set<BoardPermission> permissions
) {}

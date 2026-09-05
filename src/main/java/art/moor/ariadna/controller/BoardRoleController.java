package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.boardUser.BoardRoleDto;
import art.moor.ariadna.data.model.BoardRole;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * Named permission-bundle presets for the "invite/grant a role" UI. Adding a
 * new BoardRole constant is the only change needed for it to show up here —
 * the frontend never hardcodes what a role grants.
 */
@RestController
public class BoardRoleController {

    @GetMapping("/api/board-roles")
    public List<BoardRoleDto> getRoles() {
        return Arrays.stream(BoardRole.values())
                .map(role -> new BoardRoleDto(role.name(), role.permissions()))
                .toList();
    }
}

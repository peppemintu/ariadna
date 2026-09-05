package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.boardUser.BoardUserPermissionsUpdateDto;
import art.moor.ariadna.data.dto.boardUser.BoardUserResponseDto;
import art.moor.ariadna.service.BoardUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Membership management by its own id (not the board's) — see BoardUserService
 * for why this is guard-checked inside the service rather than declaratively.
 * Adding members happens exclusively via invitations (BoardInvitationController)
 * — see the chat notes on why a direct "add by user id" endpoint was removed.
 */
@RestController
@RequestMapping("/api/boardUser")
@RequiredArgsConstructor
public class BoardUserController {

    private final BoardUserService boardUserService;

    @PatchMapping("/{id}")
    public BoardUserResponseDto updatePermissions(
            @PathVariable UUID id,
            @Valid @RequestBody BoardUserPermissionsUpdateDto request
    ) {
        return boardUserService.updatePermissions(id, request.permissions());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable UUID id) {
        boardUserService.remove(id);
        return ResponseEntity.noContent().build();
    }

}

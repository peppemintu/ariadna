package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.boardUser.BoardUserResponseDto;
import art.moor.ariadna.data.dto.invitation.InvitationResponseDto;
import art.moor.ariadna.service.BoardInvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Invitations addressed to the current user — not board-scoped, so there's no
 * boardId to check a BoardPermission against; "is this my invitation" is
 * checked directly in BoardInvitationService.
 */
@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final BoardInvitationService boardInvitationService;

    @GetMapping("/me")
    public List<InvitationResponseDto> mine() {
        return boardInvitationService.getMine();
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<BoardUserResponseDto> accept(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(boardInvitationService.accept(id));
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<Void> decline(@PathVariable UUID id) {
        boardInvitationService.decline(id);
        return ResponseEntity.noContent().build();
    }
}

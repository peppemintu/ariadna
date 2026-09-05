package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.invitation.InvitationCreateDto;
import art.moor.ariadna.data.dto.invitation.InvitationResponseDto;
import art.moor.ariadna.service.BoardInvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/board/{boardId}/invitations")
@RequiredArgsConstructor
public class BoardInvitationController {

    private final BoardInvitationService boardInvitationService;

    @PreAuthorize("hasPermission(#boardId, 'BOARD', 'MANAGE_MEMBERS')")
    @PostMapping
    public ResponseEntity<InvitationResponseDto> invite(
            @PathVariable UUID boardId,
            @Valid @RequestBody InvitationCreateDto request,
            UriComponentsBuilder uriBuilder
    ) {
        InvitationResponseDto created = boardInvitationService.invite(boardId, request.email());
        URI location = uriBuilder.path("/api/invitations/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PreAuthorize("hasPermission(#boardId, 'BOARD', 'MANAGE_MEMBERS')")
    @GetMapping
    public List<InvitationResponseDto> pending(@PathVariable UUID boardId) {
        return boardInvitationService.getPendingForBoard(boardId);
    }
}

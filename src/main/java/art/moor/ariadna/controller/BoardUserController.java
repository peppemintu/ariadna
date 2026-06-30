package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.board.BoardResponseDto;
import art.moor.ariadna.data.dto.boardUser.BoardUserResponseDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;
import art.moor.ariadna.service.BoardUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boardUser")
@RequiredArgsConstructor
public class BoardUserController {

    private final BoardUserService boardUserService;

    @PostMapping("/board/{boardId}/user/{userId}")
    public ResponseEntity<BoardUserResponseDto> addUserToBoard(@PathVariable UUID boardId, @PathVariable UUID userId,
                                                   UriComponentsBuilder uriBuilder) {
        BoardUserResponseDto created = boardUserService.addUserToBoard(boardId, userId);
        URI location = uriBuilder.path("/api/boardUser/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/board/{boardId}/users")
    public List<UserResponseDto> getAllUsersByBoard(@PathVariable UUID boardId) {
        return boardUserService.getAllUsersByBoard(boardId);
    }

    @GetMapping("/boards/user/{userId}")
    public List<BoardResponseDto> getAllBoardsByUser(@PathVariable UUID userId) {
        return boardUserService.getAllBoardsByUser(userId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        boardUserService.delete(id);
        return ResponseEntity.noContent().build();
    }

}

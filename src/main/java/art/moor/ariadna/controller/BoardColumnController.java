package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.boardColumn.BoardColumnCreateDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnMoveDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnResponseDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnUpdateDto;
import art.moor.ariadna.service.BoardColumnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BoardColumnController {

    private final BoardColumnService boardColumnService;

    @PostMapping("/api/board/{boardId}/column")
    public ResponseEntity<BoardColumnResponseDto> create(
            @PathVariable UUID boardId,
            @Valid @RequestBody BoardColumnCreateDto request,
            UriComponentsBuilder uriBuilder) {
        BoardColumnResponseDto created = boardColumnService.create(boardId, request);
        URI location = uriBuilder.path("/api/column/{id}")
                .buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/api/board/{boardId}/column")
    public List<BoardColumnResponseDto> getByBoard(@PathVariable UUID boardId) {
        return boardColumnService.getByBoard(boardId);
    }

    @GetMapping("/api/column/{id}")
    public BoardColumnResponseDto getById(@PathVariable UUID id) {
        return boardColumnService.getById(id);
    }

    @PutMapping("/api/column/{id}")
    public BoardColumnResponseDto update(
            @PathVariable UUID id,
            @Valid @RequestBody BoardColumnUpdateDto request) {
        return boardColumnService.update(id, request);
    }

    @PatchMapping("/api/column/{id}/position")
    public BoardColumnResponseDto move(@PathVariable UUID id, @Valid @RequestBody BoardColumnMoveDto columnMoveDto) {
        return boardColumnService.move(id, columnMoveDto);
    }

    @DeleteMapping("/api/column/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        boardColumnService.delete(id);
        return ResponseEntity.noContent().build();
    }

}

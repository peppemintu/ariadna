package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.board.BoardFullDto;
import art.moor.ariadna.data.dto.board.BoardRequestDto;
import art.moor.ariadna.data.dto.board.BoardResponseDto;
import art.moor.ariadna.service.BoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PostMapping
    public ResponseEntity<BoardResponseDto> create(@Valid @RequestBody BoardRequestDto request,
                                                   UriComponentsBuilder uriBuilder) {
        BoardResponseDto created = boardService.createBoard(request);
        URI location = uriBuilder.path("/api/board/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{id}")
    public BoardResponseDto getById(@PathVariable UUID id) {
        return boardService.getById(id);
    }

    @GetMapping("/{id}/full")
    public BoardFullDto getFullBoardById(@PathVariable UUID id) {
        return boardService.getFullBoardById(id);
    }

    @GetMapping
    public List<BoardResponseDto> getAll() {
        return boardService.getAll();
    }

    @PutMapping("/{id}")
    public BoardResponseDto update(@PathVariable UUID id,
                                   @Valid @RequestBody BoardRequestDto request) {
        return boardService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        boardService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
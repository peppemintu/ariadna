package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.card.*;
import art.moor.ariadna.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/card")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @PostMapping("/column/{columnId}")
    public ResponseEntity<CardResponseDto> create(
            @PathVariable UUID columnId,
            @Valid @RequestBody CardCreateDto request,
            UriComponentsBuilder uriBuilder) {
        CardResponseDto created = cardService.create(columnId, request);
        URI location = uriBuilder.path("/api/card/{id}")
                .buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/column/{columnId}")
    public List<CardResponseDto> getByColumn(@PathVariable UUID columnId) {
        return cardService.getByColumn(columnId);
    }

    @GetMapping("/{id}")
    public CardResponseDto getById(@PathVariable UUID id) {
        return cardService.getById(id);
    }

    @PutMapping("/{id}")
    public CardResponseDto update(
            @PathVariable UUID id,
            @Valid @RequestBody CardUpdateDto request) {
        return cardService.update(id, request);
    }

    @PatchMapping("/{id}/assignee")
    public CardResponseDto assign(
            @PathVariable UUID id,
            @RequestBody CardAssignDto request) {
        return cardService.assign(id, request.assigneeId());
    }

    @PatchMapping("/{id}/position")
    public CardResponseDto move(@PathVariable UUID id, @Valid @RequestBody CardMoveDto cardMoveDto) {
        return cardService.move(id, cardMoveDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        cardService.delete(id);
        return ResponseEntity.noContent().build();
    }

}

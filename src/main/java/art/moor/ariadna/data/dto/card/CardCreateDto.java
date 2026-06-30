package art.moor.ariadna.domain.dto.card;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CardCreateDto(
        @NotBlank @Size(max = 255) String title,
        String description,
        Instant deadline,
        UUID assigneeId   // optional, ссылка на BoardUser.id
) {}


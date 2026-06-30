package art.moor.ariadna.domain.dto.card;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

// assignee — отдельный PATCH, чтобы не путать null="снять" и null="не трогать"
public record CardUpdateDto(
        @NotBlank @Size(max = 255) String title,
        String description,
        Instant deadline
) {}

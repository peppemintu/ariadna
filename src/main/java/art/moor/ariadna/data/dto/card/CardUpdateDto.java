package art.moor.ariadna.data.dto.card;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CardUpdateDto(
        @NotBlank @Size(max = 255) String title,
        String description,
        Instant deadline,
        long version
) {}

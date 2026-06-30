package art.moor.ariadna.domain.dto.boardColumn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BoardColumnCreateDto(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 7) String color        // nullable — дефолт '#252525' в маппере
) {}

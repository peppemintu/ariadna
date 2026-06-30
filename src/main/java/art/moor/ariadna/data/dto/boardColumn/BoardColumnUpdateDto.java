package art.moor.ariadna.data.dto.boardColumn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BoardColumnUpdateDto(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 7) String color
) {}

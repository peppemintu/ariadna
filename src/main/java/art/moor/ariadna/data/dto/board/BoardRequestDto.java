package art.moor.ariadna.domain.dto.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BoardRequestDto(
        @NotBlank @Size(max = 255) String title
) {}

package art.moor.ariadna.data.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequestDto(
        @NotBlank @Size(max = 100) String name
) {}

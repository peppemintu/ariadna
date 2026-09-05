package art.moor.ariadna.data.dto.invitation;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InvitationCreateDto(
        @NotBlank @Email @Size(max = 100) String email
) {}

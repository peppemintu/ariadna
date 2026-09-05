package art.moor.ariadna.exception;

import java.util.UUID;

public class BoardInvitationNotFoundException extends ResourceNotFoundException {
    public BoardInvitationNotFoundException(UUID id) {
        super("Invitation not found: " + id);
    }
}

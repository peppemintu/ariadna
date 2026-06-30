package art.moor.ariadna.exception;

import java.util.UUID;

public class BoardUserNotFoundException extends ResourceNotFoundException {
    public BoardUserNotFoundException(UUID id) {
        super("Board user not found: " + id);
    }
}

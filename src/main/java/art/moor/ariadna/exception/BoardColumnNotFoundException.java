package art.moor.ariadna.exception;

import java.util.UUID;

public class BoardColumnNotFoundException extends ResourceNotFoundException {
    public BoardColumnNotFoundException(UUID id) {
        super("Board column not found: " + id);
    }
}

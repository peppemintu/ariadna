package art.moor.ariadna.exception;

import java.util.UUID;

public class BoardNotFoundException extends RuntimeException {
    public BoardNotFoundException(UUID id) {
        super("Board not found: " + id);
    }
}

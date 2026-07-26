package art.moor.ariadna.exception;

import java.util.UUID;

public class UserNotFoundException extends ResourceNotFoundException {
    public UserNotFoundException() {
        super("User not found");
    }

    public UserNotFoundException(UUID id) {
        super("User not found: " + id);
    }
}

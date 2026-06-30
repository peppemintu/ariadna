package art.moor.ariadna.exception;

import java.util.UUID;

public class CardNotFoundException extends ResourceNotFoundException {
    public CardNotFoundException(UUID id) {
        super("Card not found: " + id);
    }
}

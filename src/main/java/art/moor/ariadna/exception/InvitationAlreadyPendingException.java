package art.moor.ariadna.exception;

public class InvitationAlreadyPendingException extends RuntimeException {
    public InvitationAlreadyPendingException() {
        super("This email already has a pending invitation to this board");
    }
}

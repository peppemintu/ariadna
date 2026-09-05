package art.moor.ariadna.exception;

public class UserAlreadyMemberException extends RuntimeException {
    public UserAlreadyMemberException() {
        super("This user is already a member of the board");
    }
}

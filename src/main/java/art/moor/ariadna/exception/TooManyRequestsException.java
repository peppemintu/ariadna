package art.moor.ariadna.exception;

public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException() {
        super("Too many requests, please try again later");
    }
}

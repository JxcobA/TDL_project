package tdl.demo.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice // Tells Spring this class handles exceptions thrown by any controller
public class GlobalExceptionHandler {

    @ExceptionHandler(TaskNotFoundException.class)
    // Tells Spring when this exception is thrown anywhere, run this method instead of the default handler
    public ResponseEntity<String> handleTaskNotFound(TaskNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
        // exception.getMessage() - returns the string passed when it is thrown
    }
}

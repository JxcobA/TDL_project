package tdl.demo.exceptions;

import org.apache.coyote.Response;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice // Tells Spring this class handles exceptions thrown by any controller
public class GlobalExceptionHandler {

    @ExceptionHandler(TaskNotFoundException.class)
    // Tells Spring when this exception is thrown anywhere, run this method instead of the default handler
    public ResponseEntity<String> handleTaskNotFound(TaskNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
        // exception.getMessage() - returns the string passed when it is thrown
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldError().getDefaultMessage();
        // .getBindingResult() - Returns the BindingResult object, contains all validation errors
        // .getFieldError() - Returns the first FieldError object from the BindingResult object
        // .getDefaultMessage() - Returns the plain message associated with the constraint from the object
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", message)); // "key", value
        // Wraps response in a map so the frontend can read - todo: look up how this works
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException exception) {
        // Catches DB constraint failures, such as title too long
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "One of your fields is too long or invalid. (Probably title too long)"));
    }
}

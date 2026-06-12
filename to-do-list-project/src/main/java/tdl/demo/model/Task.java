package tdl.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import tdl.demo.enumerator.Priority;
import tdl.demo.enumerator.Status;

import java.time.LocalDateTime;

@Entity // JPA annotation, tells spring this class maps to a DB table
@NoArgsConstructor // Lombok annotation, generates a no arg constructor at runtime
@AllArgsConstructor // Lombok annotation, generates an all args constructor at runtime
@Getter // Lombok, generates getters at runtime
@Setter // Lombok, generates setters at runtime
public class Task {

    @Id
    @GeneratedValue
    private Long id;

    @NotBlank
    // Eventually could make it so blank task cards are automatically deleted
    private String title;

    // All fields in an entity are automatically marked as columns, this is here to override the default parameters
    @Column(columnDefinition = "TEXT") // Marks SQL data type as TEXT instead of VARCHAR(255)
    private String description;

    @Enumerated(EnumType.STRING) // Tells JPA to store enum as string, avoids a change in ordinal position breaking data
    private Status status;

    @Enumerated(EnumType.STRING)
    private Priority priority;

    @FutureOrPresent // Marks field to reject dates not in the future or present
    private LocalDateTime dueDate;
}

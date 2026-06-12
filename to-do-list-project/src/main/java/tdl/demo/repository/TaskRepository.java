package tdl.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tdl.demo.enumerator.Status;
import tdl.demo.model.Task;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // add methods here for SQL search and filtering

    // Spring derives the SQL from the below method names

    // Search by title keyword
    List<Task> findByTitleContainingIgnoreCase(String keyword);

    // Search by status
    List<Task> findByStatus(Status status);


    // JpaRepository contains many standard methods, such as:
    // .save(entity) - Saves an entity, creates a new record if the ID is null or updates an existing one
    // findById(ID id)
    // ...
}

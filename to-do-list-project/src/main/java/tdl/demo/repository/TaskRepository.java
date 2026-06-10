package tdl.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tdl.demo.enumerator.Status;
import tdl.demo.model.Task;

import java.util.List;

public interface TaskRepository extends JpaRepository {

    // add methods here for SQL search and filtering

    // Spring derives the SQL from the below method names

    // Search by title keyword
    List<Task> findByTitleContainingIgnoreCase(String keyword);

    List<Task> findByStatus(Status status);


}

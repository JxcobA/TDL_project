package tdl.demo.service;

import tdl.demo.enumerator.Status;
import tdl.demo.model.Task;

import java.util.List;

public interface TaskService {

    Task createTask(Task task);
    List<Task> getAllTasks();
    Task getTaskById(Long id);
    Task updateTask(Long id, Task task);
    void deleteTask(Long id);
    Task markComplete(Long id);
    List <Task> searchByTitle(String keyword);
    List <Task> filterByStatus(Status status);
}

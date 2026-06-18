package tdl.demo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tdl.demo.enumerator.Status;
import tdl.demo.model.Task;
import tdl.demo.service.TaskService;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // Create task:
    @PostMapping // Uses base URL defined in @RequestMapping
    public ResponseEntity<Task> createTask(@Valid @RequestBody Task task) {
        Task created = taskService.createTask(task);
        return ResponseEntity.status(HttpStatus.CREATED).body((created));
        // HttpStatus.CREATED - 201 status, a successful post
        // .body((created)) - attaches the created task to the response body
    }

    // Get all tasks:
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        // Create list of task objects, populate it with all saved tasks
        List<Task> tasks = taskService.getAllTasks();
        // Return response body with 200 status
        return ResponseEntity.ok(tasks);
    }

    // Get by status - filter
    @GetMapping(params = "status")
    public ResponseEntity<List<Task>> getTasksByStatus(@RequestParam Status status) {
        // Create list of task objects, populate with only those matching the requested status
        List<Task> tasks = taskService.getTasksByStatus(status);
        // Return response body with 200 status
        return ResponseEntity.ok(tasks);
    }

    // Get sorted tasks - sort
    @GetMapping(params = "sortBy")
    public ResponseEntity<List<Task>> getSortedTasks(@RequestParam String sortBy) {
        // Create list of task objects, populate with tasks sorted by param
        List<Task> tasks = taskService.getAndSortAllTasks(sortBy);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Task>> searchTasks(@RequestParam String keyword) {
        List<Task> tasks = taskService.searchTasks(keyword);
        return ResponseEntity.ok(tasks);
    }

    // Update task
    @PutMapping("/{id}") // URL template variable, takes value from actual request
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task updated) {
        // No @Valid as I want to be able to perform partial updates
        // @PathVariable puts the id value from the URL into this param
        Task task = taskService.updateTask(id, updated);
        return ResponseEntity.ok(task);
    }

    // Change task status (complete)
    @PatchMapping("/{id}/complete")
    public ResponseEntity<Task> markComplete(@PathVariable Long id) {
        Task task = taskService.markComplete(id);
        return ResponseEntity.ok(task);
    }

    // Change task status (ongoing)
    @PatchMapping("/{id}/ongoing")
    public ResponseEntity<Task> markOngoing(@PathVariable Long id) {
        Task task = taskService.markOngoing(id);
        return ResponseEntity.ok(task);
    }

    // Change task status (suspended)
    @PatchMapping("/{id}/suspended")
    public ResponseEntity<Task> markSuspended(@PathVariable Long id) {
        Task task = taskService.markSuspended(id);
        return ResponseEntity.ok(task);
    }

    // Delete task
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        // Void - a wrapper class with no body type, needed as ResponseEntity is generic (I think)
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
        // .noContent() - 204 status
        // .build() - builds response object
    }


}

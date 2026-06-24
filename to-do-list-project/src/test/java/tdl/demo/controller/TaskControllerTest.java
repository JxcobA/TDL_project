package tdl.demo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tdl.demo.enumerator.Priority;
import tdl.demo.enumerator.Status;
import tdl.demo.exceptions.TaskNotFoundException;
import tdl.demo.model.Task;
import tdl.demo.service.TaskService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Loads only what is specified from the web layer
@WebMvcTest(TaskController.class) // In this case TaskController
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc; // Simulates HTTP requests for tests

    @MockitoBean
    private TaskService taskService; // Mock TaskService

    @Autowired
    private ObjectMapper objectMapper; // Converts Java objects to/from JSON

    private Task buildTask() {
        Task task = new Task();
        task.setId(1L);
        task.setTitle("Test Task");
        task.setStatus(Status.ONGOING);
        task.setPriority(Priority.MEDIUM);
        return task;
    }

    @Test
    void createTask_returns201AndBody() throws Exception {
        Task task = buildTask();
        when(taskService.createTask(any(Task.class))).thenReturn(task);

        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(task)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Test Task")
            );
    }

    @Test
    void createTask_withBlankTitle_returns400() throws Exception {
        Task invalid = new Task();
        invalid.setTitle(""); // Violates @NotBlank model constraint

        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest()
            );
        // Validation should fail before reaching TaskService
    }

    @Test
    void getAllTasks_returns200AndList() throws Exception {
        when(taskService.getAllTasks()).thenReturn(List.of(buildTask()));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Test Task")
            );
    }

    @Test
    void getTasksByStatus_returns200AndFilteredList() throws Exception {
        when(taskService.getTasksByStatus(Status.ONGOING)).thenReturn(List.of(buildTask()));

        mockMvc.perform(get("/api/tasks").param("status", "ONGOING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ONGOING")
            );
    }

    @Test
    void getSortedTasks_returns200() throws Exception {
        when(taskService.getAndSortAllTasks("priority")).thenReturn(List.of(buildTask()));

        mockMvc.perform(get("/api/tasks").param("sortBy", "priority")).andExpect(status().isOk());
    }

    @Test
    void searchTasks_returns200AndMatches() throws Exception {
        when(taskService.searchTasks("test")).thenReturn(List.of(buildTask()));

        mockMvc.perform(get("/api/tasks/search").param("keyword", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Test Task")
            );
    }

    @Test
    void updateTask_returns200AndUpdatedBody() throws Exception {
        Task updated = buildTask();
        updated.setTitle("Updated");
        when(taskService.updateTask(eq(1L), any(Task.class))).thenReturn(updated);

        mockMvc.perform(patch("/api/tasks/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated")
            );
    }

    @Test
    void markComplete_returns200() throws Exception {
        Task completed = buildTask();
        completed.setStatus(Status.COMPLETED);
        when(taskService.markComplete(1L)).thenReturn(completed);

        mockMvc.perform(patch("/api/tasks/1/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED")
            );
    }

    @Test
    void markOngoing_returns200() throws Exception {
        when(taskService.markOngoing(1L)).thenReturn(buildTask());

        mockMvc.perform(patch("/api/tasks/1/ongoing")).andExpect(status().isOk());
    }

    @Test
    void markSuspended_returns200() throws Exception {
        Task suspended = buildTask();
        suspended.setStatus(Status.SUSPENDED);
        when(taskService.markSuspended(1L)).thenReturn(suspended);

        mockMvc.perform(patch("/api/tasks/1/suspended"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED")
            );
    }

    @Test
    void deleteTask_returns204() throws Exception {
        mockMvc.perform(delete("/api/tasks/1")).andExpect(status().isNoContent());

        verify(taskService, times(1)).deleteTask(1L);
    }

    @Test
    void markComplete_whenTaskNotFound_returns404() throws Exception {
        when(taskService.markComplete(99L)).thenThrow(new TaskNotFoundException("Task not found"));

        mockMvc.perform(patch("/api/tasks/99/complete")).andExpect(status().isNotFound());
        // Confirms GlobalExceptionHandler works for the web layer
    }
}
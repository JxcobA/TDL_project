package tdl.demo.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import tdl.demo.enumerator.Priority;
import tdl.demo.enumerator.Status;
import tdl.demo.exceptions.TaskNotFoundException;
import tdl.demo.model.Task;
import tdl.demo.repository.TaskRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// @ExtendWith - Plugs Mockito into JUnit when it runs, so @Mock/@InjectMocks fields are set up automatically
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository; // Mock TaskRepository

    @InjectMocks
    private TaskService taskService; // Real TaskService with but injected mock TaskRepository as a constructor

    private Task task;

    @BeforeEach
    void setUp() {
        task = new Task(); // Creates new Task
        task.setId(1L); // Sets Task id
        task.setTitle("Test Task"); // Sets task Title
        task.setDescription("Test Description"); // Sets Task Desc.
        task.setStatus(Status.ONGOING); // Sets Task status
        task.setPriority(Priority.MEDIUM); // Sets Task priority
        task.setDueDate(LocalDateTime.now().plusDays(1)); // Sets Task DueDate
    }

    @Test
    void createTask_setsStatusToOngoing_andSaves() {
        // Arrange:
        // when() - Defines test behaviour
        when(taskRepository.save(any(Task.class))).thenReturn(task); // If save() is called with any Task same task is returned
        Task input = new Task();
        input.setTitle("New Task");

        // Act:
        Task result = taskService.createTask(input);

        // Assert:
        assertThat(result.getStatus()).isEqualTo(Status.ONGOING); // Status forced regardless of input
        verify(taskRepository, times(1)).save(input); // Confirms save() was actually called
    }

    @Test
    void getAllTasks_returnsAllTasksFromRepository() {
        when(taskRepository.findAll()).thenReturn(List.of(task));

        List<Task> result = taskService.getAllTasks();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Task");
    }

    @Test
    void getTasksByStatus_delegatesToRepository() {
        when(taskRepository.findByStatus(Status.ONGOING)).thenReturn(List.of(task));

        List<Task> result = taskService.getTasksByStatus(Status.ONGOING);

        assertThat(result).containsExactly(task);
    }

    @Test
    void searchTasks_passesKeywordToBothTitleAndDescriptionParams() {
        when(taskRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase("test", "test")).thenReturn(List.of(task));

        List<Task> result = taskService.searchTasks("test");

        assertThat(result).containsExactly(task);
    }

    @Test
    void markComplete_whenTaskExists_updatesStatusAndSaves() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        Task result = taskService.markComplete(1L);

        assertThat(result.getStatus()).isEqualTo(Status.COMPLETED);
    }

    @Test
    void markComplete_whenTaskMissing_throwsTaskNotFoundException() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        // Runs the lambda and checks the right exception type is thrown
        assertThrows(TaskNotFoundException.class, () -> taskService.markComplete(99L));
    }

    @Test
    void markOngoing_whenTaskExists_updatesStatus() {
        task.setStatus(Status.SUSPENDED);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        Task result = taskService.markOngoing(1L);

        assertThat(result.getStatus()).isEqualTo(Status.ONGOING);
    }

    @Test
    void markSuspended_whenTaskExists_updatesStatus() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        Task result = taskService.markSuspended(1L);

        assertThat(result.getStatus()).isEqualTo(Status.SUSPENDED);
    }

    @Test
    void updateTask_onlyOverwritesNonNullFields() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));
        // thenAnswer() - Returns whatever was actually passed in instead of a fixed value

        Task partialUpdate = new Task();
        partialUpdate.setTitle("Updated Title"); // Only sets the title, everything else is null

        Task result = taskService.updateTask(1L, partialUpdate);

        assertThat(result.getTitle()).isEqualTo("Updated Title"); // Should be changed
        assertThat(result.getDescription()).isEqualTo("Test Description"); // Should be unchanged
        assertThat(result.getPriority()).isEqualTo(Priority.MEDIUM); // Should be unchanged
    }

    @Test
    void updateTask_whenTaskMissing_throwsTaskNotFoundException() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(TaskNotFoundException.class, () -> taskService.updateTask(99L, new Task()));
    }

    @Test
    void deleteTask_callsRepositoryDeleteById() {
        taskService.deleteTask(1L);

        verify(taskRepository, times(1)).deleteById(1L);
    }

    @Test
    void getAndSortAllTasks_callsFindAllWithSort() {
        when(taskRepository.findAll(any(Sort.class))).thenReturn(List.of(task));

        List<Task> result = taskService.getAndSortAllTasks("priority");

        assertThat(result).containsExactly(task);
        verify(taskRepository).findAll(Sort.by("priority"));
    }
}
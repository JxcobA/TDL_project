

// Constant for the add task form element
const addTaskForm = document.getElementById('add-task-form');

// Event listener for the task form element
addTaskForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    // preventDefault() stops default behaviour (No page reload on submit)

    // newTask constant containing task data
    const newTask = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        dueDate: document.getElementById('dueDate').value,
        priority: document.getElementById('priority').value
        // TaskService forces ONGOING on creation, so no 'status' here
    };

    // Response constant - stores the Response object
    const response = await fetch('/api/tasks', { // awaits a promise until a Response object is resolved
        method: 'POST', // Sets HTTP method to POST
        headers: { 'Content-Type': 'application/json' }, // Tells the server the body is JSON - needed by @RequestBody to deserialise, otherwise treated as plain text
        body: JSON.stringify(newTask) // converts object into JSON string
    });

    if (response.ok) {
        addTaskForm.reset(); // clears the form fields
        loadTasks(); // Call loadTasks() after after creating a new task
    } else {
        console.error('Failed to create task');
    }
});

// TODO: refresh the task list so the new task appears

// Just realised, I've been using task as a name instead of todo...

// Load tasks function:
async function loadTasks() {
    const response = await fetch('/api/tasks');
    const tasks = await response.json(); // parses the response body from a JSON string into an array (JS) of objects

    const taskList = document.getElementById('task-list'); // Task list element constant
    taskList.innerHTML = '';
    // Clear existing content before re-rendering, otherwise tasks would duplicate on every refresh

    tasks.forEach(task => { // iterate over each task in the array
        const taskDiv = document.createElement('div'); // Create taskDiv element
        taskDiv.textContent = `${task.title} - ${task.status} - ${task.priority}`; // set the title, status and priority of the taskDiv
        taskList.appendChild(taskDiv); // Append the taskDiv to the taskList
    });
}

// Call loadTasks() on page load
window.addEventListener('DOMContentLoaded', loadTasks);



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
    const tasks = await response.json();
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    if (tasks.length === 0) {
        taskList.innerHTML = '<p>No tasks</p>';
        return;
    }

    // Clear existing content before re-rendering, otherwise tasks would duplicate on every refresh

    tasks.forEach(task => { // iterate over each task in the array
        const taskDiv = document.createElement('div'); // Create taskDiv element
        taskDiv.classList.add('task');

        taskDiv.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || ''}</p>
            <p>Status: ${task.status}</p>
            <p>Priority: ${task.priority}</p>
            <p>Due: ${formatDate(task.dueDate)}</p>
            <div class="task-buttons">
                <button class="btn-complete" onclick="markComplete(${task.id})">Complete</button>
            <button class="btn-ongoing" onclick="markOngoing(${task.id})">Ongoing</button>
                <button class="btn-suspend" onclick="markSuspended(${task.id})">Suspend</button>
                <button class="btn-delete" onclick="confirmDelete(${task.id})">Delete</button>
            </div>
        `;

        taskList.appendChild(taskDiv); // Append the taskDiv to the taskList
    });
}

// Confirm task deletion:

function confirmDelete(id) {
    if (confirm('Delete this task?')) {
        deleteTask(id);
    }
}

// Delete tasks: (This may be redundant/fully covered in the backend)
async function deleteTask(id) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            console.error('Delete failed');
            return;
        }

        loadTasks();

    } catch (err) {
        console.error('Network error:', err);
    }
}


// Status update functions:

// Mark as complete:
async function markComplete(id) {
    await updateStatus(id, 'complete');
}

// Mark as ongoing
async function markOngoing(id) {
    await updateStatus(id, 'ongoing');
}

// Mark as suspended
async function markSuspended(id) {
    await updateStatus(id, 'suspended');
}

async function updateStatus(id, action) {
    try {
        const response = await fetch(`/api/tasks/${id}/${action}`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            console.error('Status update failed');
            return;
        }
        loadTasks();
    } catch (err) {
        console.error('Network error:', err);
    }
}

// Format date function:
function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
}

// Call loadTasks() on page load
window.addEventListener('DOMContentLoaded', loadTasks);

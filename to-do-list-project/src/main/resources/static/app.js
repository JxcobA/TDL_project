// Element constants:
const addTaskForm = document.getElementById('add-task-form');
const matchesList = document.getElementById('task-list-matches');
const restList = document.getElementById('task-list-rest');
const matchesHeading = document.getElementById('matches-heading');
const restHeading = document.getElementById('rest-heading');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const filterButtons = document.querySelectorAll('#filter-buttons button');
const sortButtons = document.querySelectorAll('#sort-buttons button');




let currentStatus = 'ALL'; // Tracks the active task filter


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



// Event listener for filter buttons
filterButtons.forEach(button => { // Loops through buttons
    button.addEventListener('click', () => { // Attaches a click handler
        currentStatus = button.dataset.status; // Gets the status of whichever button was clicked
        searchInput.value = ''; // Clears search
        loadTasks();
    });
});


// Helper function:
function renderList(container, tasks) {
    // container - Represents an element (e.g. An element that will hold the list of tasks, depends on my frontend design)
    // tasks - An array of task objects
    container.innerHTML = ''; // Clears container
    if (tasks.length === 0) { // If no tasks
        container.innerHTML = '<p>No tasks</p>'; // Set element content to this
        return;
    }

    // NOTE: Add something that clears existing content before re-rendering, tasks are being duplicated


    tasks.forEach(task => {
        const taskDiv = document.createElement('div'); // Creates a taskDiv element
        taskDiv.classList.add('task'); // Assign taskDiv the class 'task'
        // Sets the content of taskDiv
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
        container.appendChild(taskDiv); // Append taskDiv to container
    });
}



// TODO: Refresh the task list so the new task appears
// Just realised, I've been using task as a name instead of todo...



// Load tasks function:
async function loadTasks() {
    // URL changes for each filter using ternary
    const url = currentStatus === 'ALL' ? '/api/tasks' : `/api/tasks?status=${currentStatus}`;

    const response = await fetch(url);
    const tasks = await response.json();

    matchesHeading.style.display = 'none';
    restHeading.style.display = 'none';
    restList.innerHTML = '';

    renderList(matchesList, tasks);
}



// Sorting:
sortButtons.forEach(button => { // Loops through buttons
    button.addEventListener('click', async () => { // Adds a click handler
        const sortBy = button.dataset.sort; // Gets the sort type of whichever button was clicked
        const response = await fetch(`/api/tasks?sortBy=${sortBy}`); // URL used depends on sort type, this is then requested and resolved as the response object
        const tasks = await response.json(); // Parses the response body stored in response object

        matchesHeading.style.display = 'none'; // Sets display style of matchesHeading elements to 'none'
        restHeading.style.display = 'none'; // Sets display style of restHeading elements to 'none'
        restList.innerHTML = ''; // Clears content of restList

        renderList(matchesList, tasks); // Calls helper function to create and render the tasks
    });
});



// Search:
searchButton.addEventListener('click', async () => {
    const keyword = searchInput.value.trim(); // Trimmed search value assigned to a constant
    if (!keyword) { // Display tasks if no search
        loadTasks();
        return;
    }
    const [matchesResponse, allResponse] = await Promise.all([
        fetch(`/api/tasks/search?keyword=${encodeURIComponent(keyword)}`),
        fetch('/api/tasks')]);
    // Each fetch call starts a network request and returns a Promise
    // Promise.all() - Takes an array of promises, in this case the above fetch calls, starts them simultaneously
    // [matchesResponse, allResponse] - Two variables which will be assigned to the fetched arrays

    const matches = await matchesResponse.json();
    const allTasks = await allResponse.json();

    const matchIds = new Set(matches.map(task => task.id));
    const rest = allTasks.filter(task => !matchIds.has(task.id));

    matchesHeading.style.display = 'block';
    restHeading.style.display = 'block';

    renderList(matchesList, matches);
    renderList(restList, rest);
});



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











// OLD CODE:

// This has been partially replaced with a helper function
// Sorting:
//sortButtons.forEach(button => { // Loops through buttons
//    button.addEventListener('click', async () => { // Attaches a click handler
//        const sortBy = button.dataset.sort; // Creates a constant of the button's the data attribute
//        const response = await fetch(`/api/tasks?sortBy=${sortBy}`); // Get request
//        const tasks = await response.json(); // Awaits response then assigns it to a constant
//
//        matchesHeading.style.display = 'none'; // --------------------------------- left off here
//        restHeading.style.display = 'none';
//        restList.innerHTML = '';
//
//        matchesList.innerHTML = '';
//        tasks.forEach(task => {
//            const taskDiv = document.createElement('div');
//            taskDiv.classList.add('task');
//            taskDiv.innerHTML = `
//                <h3>${task.title}</h3>
//                <p>${task.description || ''}</p>
//                <p>Status: ${task.status}</p>
//                <p>Priority: ${task.priority}</p>
//                <p>Due: ${formatDate(task.dueDate)}</p>
//                <div class="task-buttons">
//                    <button class="btn-complete" onclick="markComplete(${task.id})">Complete</button>
//                    <button class="btn-ongoing" onclick="markOngoing(${task.id})">Ongoing</button>
//                    <button class="btn-suspend" onclick="markSuspended(${task.id})">Suspend</button>
//                    <button class="btn-delete" onclick="confirmDelete(${task.id})">Delete</button>
//                </div>
//            `;
//            matchesList.appendChild(taskDiv);
//        });
//    });
//});
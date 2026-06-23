// Element constants:
const addTaskForm = document.getElementById('add-task-form'); // Form element for adding a new task
const matchesList = document.getElementById('task-list-matches'); // Container for tasks matching the current search
const restList = document.getElementById('task-list-rest'); // Container for non-matching tasks
const matchesHeading = document.getElementById('matches-heading'); // The heading shown above the search match list during a search
const restHeading = document.getElementById('rest-heading'); // Heading shown above the rest list after during a search
const searchInput = document.getElementById('search-input'); // The search bar element
//const searchButton = document.getElementById('search-button'); // Button to trigger the search
const filterButtons = document.querySelectorAll('#filter-buttons button'); // Status filter buttons
const sortButtons = document.querySelectorAll('#sort-buttons button'); // Sort buttons




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
    const response = await fetch('/api/tasks', { // Awaits a promise until a Response object is resolved
        method: 'POST', // Sets HTTP method to POST
        headers: { 'Content-Type': 'application/json' }, // Tells the server the body is JSON - needed by @RequestBody to deserialise, otherwise treated as plain text
        body: JSON.stringify(newTask) // Converts object into JSON string
    });

    if (response.ok) {
        addTaskForm.reset(); // Clears the form fields
        document.getElementById('error-message').style.display = 'none'; // Clears any old error
        loadTasks(); // Call loadTasks() after after creating a new task
    } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to create task. Check your input.');
    }
    // TODO: Update GlobalExceptionHandler with MethodArgumentNotValidException and whatever else has happened
});



// Event listener for filter buttons
filterButtons.forEach(button => { // Loops through buttons
    button.addEventListener('click', () => { // Attaches a click handler
        currentStatus = button.dataset.status; // Gets the status of whichever button was clicked
        searchInput.value = ''; // Clears search
        loadTasks();
    });
});



// Helper to convert a date into the exact format datetime local inputs need
function toDateTimeInputValue(date) {
    if (!date) return ''; // No date, return empty
    const d = new Date(date); // Date object constant
    const pad = n => String(n).padStart(2, '0'); // .padStart() - Ensures single digits get a leading zero as required by input format
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}



// View mode for a single task
function renderViewMode(task, keyword = '') {
    return `
        <div class="task-top-row">
            <h3>${highlight(task.title, keyword)}</h3>
            <p>${task.status} / ${task.priority}</p>
        </div>
        <p class="task-description" onclick="this.classList.toggle('expanded')">${highlight(task.description || '', keyword)}</p>
        <p>Due: ${formatDate(task.dueDate)}</p>
        <div class="task-buttons">
            <button class="btn-complete" onclick="markComplete(${task.id})">Complete</button>
            <button class="btn-ongoing" onclick="markOngoing(${task.id})">Ongoing</button>
            <button class="btn-suspend" onclick="markSuspended(${task.id})">Suspend</button>
            <button class="btn-delete" onclick="confirmDelete(${task.id})">Delete</button>
            <button class="btn-edit" onclick="toggleEdit(${task.id})">Edit</button>
        </div>
    `;
}



// Edit mode for a single task
function renderEditMode(task) {
    return `
        <div class="task-top-row">
            <input type="text" id="edit-title-${task.id}" value="${task.title}">
        </div>
        <textarea id="edit-description-${task.id}">${task.description || ''}</textarea>
        <input type="datetime-local" id="edit-dueDate-${task.id}" value="${toDateTimeInputValue(task.dueDate)}">
        <div class="task-buttons">
            <button class="btn-save" onclick="saveEdit(${task.id})">Save</button>
            <button class="btn-cancel" onclick="toggleEdit(${task.id})">Cancel</button>
        </div>
    `;
}



// Task rendering helper function:
function renderList(container, tasks, keyword) {
    // container - Represents an element (e.g. An element that will hold the list of tasks, depends on my frontend design)
    // tasks - An array of task objects
    container.innerHTML = ''; // Clears container
    if (tasks.length === 0) { // If no tasks
        container.innerHTML = '<p>No tasks</p>'; // Set element content to this
        return;
    }

    tasks.forEach(task => { // Loops through tasks
        taskCache[task.id] = task; // Remembers this task's data for edit mode
        const taskDiv = document.createElement('div');
        taskDiv.classList.add('task');
        taskDiv.id = `task-${task.id}`; // Assigns each task card an id, used by toggleEdit
        taskDiv.innerHTML = renderViewMode(task, keyword);
        container.appendChild(taskDiv);
    });
}



// Search term highlighting
function highlight(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp(keyword, 'gi'); // g - all matches, i - case-insensitive
    return text.replace(regex, match => `<mark>${match}</mark>`); // Uses html mark tags
}



// Adds toggle functionality to task creation section
function toggleAddTask() {
    const form = document.getElementById('add-task-form');
    const arrow = document.getElementById('add-task-arrow');
    form.classList.toggle('collapsed'); // adds/removes the class that hides it
    arrow.textContent = form.classList.contains('collapsed') ? '▲' : '▼'; // Ternary to flip the arrow direction when toggled
}



// Toggle control section
function toggleControls() {
    const body = document.getElementById('controls-body');
    const arrow = document.getElementById('controls-arrow');
    body.classList.toggle('collapsed');
    arrow.textContent = body.classList.contains('collapsed') ? '▼' : '▲';
}



// Stores task data in memory so I can switch between edit and view without another fetch
let taskCache = {};

// Toggle edit mode function
function toggleEdit(id) {
    const taskDiv = document.getElementById(`task-${id}`);
    const task = taskCache[id];

    // If currently showing inputs, classList.contains tells us which mode we're in
    if (taskDiv.dataset.editing === 'true') {
        taskDiv.innerHTML = renderViewMode(task);
        taskDiv.dataset.editing = 'false';
    } else {
        taskDiv.innerHTML = renderEditMode(task);
        taskDiv.dataset.editing = 'true';
    }
}

// Sends edited fields to the backend, then exits edit mode
async function saveEdit(id) {
    const updated = {
        title: document.getElementById(`edit-title-${id}`).value,
        description: document.getElementById(`edit-description-${id}`).value,
        dueDate: document.getElementById(`edit-dueDate-${id}`).value
    };

    const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
    });

    if (response.ok) {
        loadTasks(); // refreshes the whole list, exits edit mode automatically
    } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to update task.');
    }
}



// Error message helper function:
function showError(message) {
    const errorPopup = document.getElementById('error-message'); // Assigns errorPopup to the error-message element
    errorPopup.textContent = message; // Sets content of errorPopup to the error message
    errorPopup.style.display = 'block';  // Makes errorPopup visible (was blank previously)
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



// Live search:
let searchTimeout; // Stores timer

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout); // Cancels the previous search
    searchTimeout = setTimeout(runSearch, 400); // Waits 400ms after last keystroke then runs search
});



// Search
async function runSearch() {
    const keyword = searchInput.value.trim(); // Trimmed search value assigned to a constant
    if (!keyword) { // Display tasks if no search
        loadTasks();
        return;
    }
    const [matchesResponse, allResponse] = await Promise.all([
        fetch(`/api/tasks/search?keyword=${encodeURIComponent(keyword)}`),
        fetch('/api/tasks')
    ]);
    // Each fetch call starts a network request and returns a Promise
    // Promise.all() - Takes an array of promises, in this case the above fetch calls, starts them simultaneously
    // [matchesResponse, allResponse] - Two variables which will be assigned to the fetched arrays
    // encodeURIComponent(keyword) - UTF-8 encodes using escape characters

    const matches = await matchesResponse.json();
    const allTasks = await allResponse.json();

    const matchIds = new Set(matches.map(task => task.id));
    const rest = allTasks.filter(task => !matchIds.has(task.id));

    matchesHeading.style.display = 'block';
    restHeading.style.display = 'block';

    renderList(matchesList, matches, keyword);
    renderList(restList, rest, keyword);
}



// Delete tasks: (This may be redundant)
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



// Confirm task deletion:
const deletePopup = document.getElementById('delete-popup'); // Delete popup element
const confirmDeleteBtn = document.getElementById('confirm-delete-btn'); // Confirmation button
const cancelDeleteBtn = document.getElementById('cancel-delete-btn'); // Cancel deletion button

let pendingDeleteId = null; // Stores which task is awaiting confirmation

// Opens the popup and remembers which task it is for
function confirmDelete(id) {
    pendingDeleteId = id;
    deletePopup.style.display = 'flex';
}
// Confirm deletion button:
confirmDeleteBtn.addEventListener('click', () => { // Delete confirmation button click handler
    if (pendingDeleteId !== null) { // Null check
        deleteTask(pendingDeleteId); // Deletes task
    }
    deletePopup.style.display = 'none'; // Hides confirmation popup
    pendingDeleteId = null; // Clears memory of which task is being deleted
});

// Cancel deletion button:
cancelDeleteBtn.addEventListener('click', () => { // Clock handler
    deletePopup.style.display = 'none'; // Hides delete popup
    pendingDeleteId = null; // Clears memory of which task is being deleted
});



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

// Task rendering helper function:
//function renderList(container, tasks) {
//    // container - Represents an element (e.g. An element that will hold the list of tasks, depends on my frontend design)
//    // tasks - An array of task objects
//    container.innerHTML = ''; // Clears container
//    if (tasks.length === 0) { // If no tasks
//        container.innerHTML = '<p>No tasks</p>'; // Set element content to this
//        return;
//    }
//
//    // NOTE: Add something that clears existing content before re-rendering, tasks are being duplicated
//
//
//    tasks.forEach(task => {
//        const taskDiv = document.createElement('div'); // Creates a taskDiv element
//        taskDiv.classList.add('task'); // Assign taskDiv the class 'task'
//        // Sets the content of taskDiv
//        taskDiv.innerHTML = `
//            <div class="task-top-row">
//                <h3>${task.title}</h3>
//                <p>${task.status} / ${task.priority}</p>
//            </div>
//            <p>${task.description || ''}</p>
//            <p>Due: ${formatDate(task.dueDate)}</p>
//            <div class="task-buttons">
//                <button class="btn-complete" onclick="markComplete(${task.id})">Complete</button>
//                <button class="btn-ongoing" onclick="markOngoing(${task.id})">Ongoing</button>
//                <button class="btn-suspend" onclick="markSuspended(${task.id})">Suspend</button>
//                <button class="btn-delete" onclick="confirmDelete(${task.id})">Delete</button>
//                <button class="btn-edit" onclick="toggleEdit(${task.id})">Edit</button>
//            </div>
//        `;
//        container.appendChild(taskDiv); // Append taskDiv to container
//    });
//}



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






// Search:
//searchInput.addEventListener('click', async () => {
//    const keyword = searchInput.value.trim(); // Trimmed search value assigned to a constant
//    if (!keyword) { // Display tasks if no search
//        loadTasks();
//        return;
//    }
//    const [matchesResponse, allResponse] = await Promise.all([
//        fetch(`/api/tasks/search?keyword=${encodeURIComponent(keyword)}`),
//        fetch('/api/tasks')]);
//    // Each fetch call starts a network request and returns a Promise
//    // Promise.all() - Takes an array of promises, in this case the above fetch calls, starts them simultaneously
//    // [matchesResponse, allResponse] - Two variables which will be assigned to the fetched arrays
//    // encodeURIComponent(keyword) - UTF-8 encodes using escape characters
//
//    const matches = await matchesResponse.json();
//    const allTasks = await allResponse.json();
//
//    const matchIds = new Set(matches.map(task => task.id));
//    const rest = allTasks.filter(task => !matchIds.has(task.id));
//
//    matchesHeading.style.display = 'block';
//    restHeading.style.display = 'block';
//
//    renderList(matchesList, matches, keyword);
//    renderList(restList, rest, keyword);
//});
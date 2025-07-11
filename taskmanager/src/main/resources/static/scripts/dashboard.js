// Dashboard functionality
class DashboardManager {
    constructor() {
        this.apiClient = apiClient;
        this.tasks = [];
    }

    // Load tasks from backend
    async loadTasks() {
        try {
            showLoading(true);
            this.tasks = await this.apiClient.get('/tasks');
            this.renderTasks();
        } catch (error) {
            showMessage(error.message || 'Failed to load tasks.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // Render tasks in dashboard
    renderTasks() {
        const tasksContainer = document.getElementById('tasks-container');
        if (!tasksContainer) return;

        if (this.tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="col-12">
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-tasks fa-3x mb-3"></i>
                        <h4>No tasks yet</h4>
                        <p>Create your first task to get started!</p>
                    </div>
                </div>
            `;
            return;
        }

        const tasksHtml = this.tasks.map(task => this.renderTaskCard(task)).join('');
        tasksContainer.innerHTML = tasksHtml;
        this.bindTaskEvents();
    }

    renderTaskCard(task) {
        const priorityClass = this.getPriorityClass(task.priority);
        const statusClass = this.getStatusClass(task.status);
        const collaborators = task.collaborators || [];

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 task-card" data-task-id="${task.id}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span class="badge ${priorityClass}">${task.priority || 'MEDIUM'}</span>
                        <span class="badge ${statusClass}">${task.status || 'PENDING'}</span>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${task.title}</h5>
                        <p class="card-text">${task.description || 'No description'}</p>
                        ${task.dueDate ? `<p class="text-muted"><i class="fas fa-calendar"></i> Due: ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                        ${collaborators.length > 0 ? `
                            <div class="collaborators mb-2">
                                <small class="text-muted">Collaborators:</small>
                                <div class="mt-1">
                                    ${collaborators.map(username => `<span class="badge bg-secondary me-1">${username}</span>`).join('')}
                                </div>
                            </div>` : ''}
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="editTask(${task.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-info" onclick="addCollaborator(${task.id})">
                                <i class="fas fa-user-plus"></i> Assign
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${task.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getPriorityClass(priority) {
        switch (priority) {
            case 'HIGH': return 'bg-danger';
            case 'MEDIUM': return 'bg-warning';
            case 'LOW': return 'bg-success';
            default: return 'bg-warning';
        }
    }

    getStatusClass(status) {
        switch (status) {
            case 'COMPLETED': return 'bg-success';
            case 'IN_PROGRESS': return 'bg-info';
            case 'PENDING': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    }

    bindTaskEvents() {
        // For simplicity, handled by global functions
    }

    filterTasks(searchTerm, statusFilter, priorityFilter) {
        let filteredTasks = this.tasks;

        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter && statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
        }

        if (priorityFilter && priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }

        const originalTasks = this.tasks;
        this.tasks = filteredTasks;
        this.renderTasks();
        this.tasks = originalTasks;
    }
}

const dashboardManager = new DashboardManager();

function editTask(taskId) {
    const task = dashboardManager.tasks.find(t => t.id === taskId);
    if (task) {
        taskManager.openEditModal(task);
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        taskManager.deleteTask(taskId).then(() => {
            dashboardManager.loadTasks();
        });
    }
}

function addCollaborator(taskId) {
    const username = prompt('Enter username to add as collaborator:');
    if (username) {
        taskManager.addCollaborator(taskId, username).then(() => {
            dashboardManager.loadTasks();
        });
    }
}

function initializeDashboard() {
    dashboardManager.loadTasks();

    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            dashboardManager.filterTasks(e.target.value, statusFilter.value, priorityFilter.value);
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            dashboardManager.filterTasks(searchInput.value, e.target.value, priorityFilter.value);
        });
    }

    if (priorityFilter) {
        priorityFilter.addEventListener('change', (e) => {
            dashboardManager.filterTasks(searchInput.value, statusFilter.value, e.target.value);
        });
    }

    const newTaskForm = document.getElementById('new-task-form');
    if (newTaskForm) {
        newTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(newTaskForm);
            const user = apiClient.getUserInfo();

            const taskData = {
                title: formData.get('title'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                status: formData.get('status'),
                dueDate: formData.get('dueDate') || null,
                owner: { username: user?.username } // ✅ critical fix
            };

            try {
                await taskManager.createTask(taskData);
                newTaskForm.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('newTaskModal'));
                if (modal) modal.hide();
                dashboardManager.loadTasks();
            } catch (error) {
                // Handled in taskManager
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!apiClient.isAuthenticated()) {
        redirectTo('/login.html');
        return;
    }

    const userInfo = apiClient.getUserInfo();
    if (userInfo) {
        const userElements = document.querySelectorAll('.current-user');
        userElements.forEach(el => el.textContent = userInfo.username);
    }

    initializeDashboard();
});
// Task management functionality
class TaskManager {
    constructor() {
        this.apiClient = apiClient;
        this.editingTaskId = null;
    }

    // Create new task
    async createTask(taskData) {
        try {
            showLoading(true);
            const response = await this.apiClient.post('/tasks', taskData);
            showMessage('Task created successfully!', 'success');
            return response;
        } catch (error) {
            showMessage(error.message || 'Failed to create task.', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Update existing task
    async updateTask(taskId, taskData) {
        try {
            showLoading(true);
            const response = await this.apiClient.put(`/tasks/${taskId}`, taskData);
            showMessage('Task updated successfully!', 'success');
            return response;
        } catch (error) {
            showMessage(error.message || 'Failed to update task.', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Delete task
    async deleteTask(taskId) {
        try {
            showLoading(true);
            await this.apiClient.delete(`/tasks/${taskId}`);
            showMessage('Task deleted successfully!', 'success');
            return true;
        } catch (error) {
            showMessage(error.message || 'Failed to delete task.', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Add collaborator to task
    async addCollaborator(taskId, username) {
        try {
            showLoading(true);
            await this.apiClient.put(`/tasks/${taskId}/collaborators/${username}`);
            showMessage(`Collaborator ${username} added successfully!`, 'success');
            return true;
        } catch (error) {
            showMessage(error.message || 'Failed to add collaborator.', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Open edit modal with task data
    openEditModal(task) {
        this.editingTaskId = task.id;
        document.getElementById('edit-title').value = task.title;
        document.getElementById('edit-description').value = task.description || '';
        document.getElementById('edit-priority').value = task.priority || 'MEDIUM';
        document.getElementById('edit-status').value = task.status || 'PENDING';
        document.getElementById('edit-dueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
        const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
        modal.show();
    }

    // Handle edit form submission
    async handleEditSubmit(event) {
        event.preventDefault();
        if (!this.editingTaskId) return;

        const formData = new FormData(event.target);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            status: formData.get('status'),
            dueDate: formData.get('dueDate') || null
        };

        try {
            await this.updateTask(this.editingTaskId, taskData);
            const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
            if (modal) modal.hide();

            if (typeof dashboardManager !== 'undefined') {
                dashboardManager.loadTasks();
            }

            this.editingTaskId = null;
        } catch (error) {
            // Error already handled
        }
    }

    // Handle new task form submission
    async handleNewTaskSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const user = apiClient.getUserInfo();

        if (!user) {
            showMessage('User not authenticated.', 'error');
            return;
        }

        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            status: formData.get('status'),
            dueDate: formData.get('dueDate') || null,
            owner: {
                username: user.username
            }
        };

        if (!taskData.title.trim()) {
            showMessage('Task title is required.', 'error');
            return;
        }

        try {
            await this.createTask(taskData);
            event.target.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('newTaskModal'));
            if (modal) modal.hide();

            if (typeof dashboardManager !== 'undefined') {
                dashboardManager.loadTasks();
            }
        } catch (error) {
            // Error already handled
        }
    }

    // Handle add collaborator form submission
    async handleAddCollaboratorSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const taskId = formData.get('taskId');
        const username = formData.get('username');

        if (!taskId || !username) {
            showMessage('Task ID and username are required.', 'error');
            return;
        }

        try {
            await this.addCollaborator(taskId, username);
            event.target.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCollaboratorModal'));
            if (modal) modal.hide();

            if (typeof dashboardManager !== 'undefined') {
                dashboardManager.loadTasks();
            }
        } catch (error) {
            // Error already handled
        }
    }

    // Get task statistics
    getTaskStats(tasks) {
        return {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'COMPLETED').length,
            inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
            pending: tasks.filter(t => t.status === 'PENDING').length,
            highPriority: tasks.filter(t => t.priority === 'HIGH').length,
            overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length
        };
    }

    // Render task statistics
    renderTaskStats(tasks) {
        const stats = this.getTaskStats(tasks);
        const statsContainer = document.getElementById('task-stats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-2"><div class="card bg-primary text-white"><div class="card-body text-center"><h3>${stats.total}</h3><p>Total</p></div></div></div>
                <div class="col-md-2"><div class="card bg-success text-white"><div class="card-body text-center"><h3>${stats.completed}</h3><p>Completed</p></div></div></div>
                <div class="col-md-2"><div class="card bg-info text-white"><div class="card-body text-center"><h3>${stats.inProgress}</h3><p>In Progress</p></div></div></div>
                <div class="col-md-2"><div class="card bg-secondary text-white"><div class="card-body text-center"><h3>${stats.pending}</h3><p>Pending</p></div></div></div>
                <div class="col-md-2"><div class="card bg-warning text-white"><div class="card-body text-center"><h3>${stats.highPriority}</h3><p>High Priority</p></div></div></div>
                <div class="col-md-2"><div class="card bg-danger text-white"><div class="card-body text-center"><h3>${stats.overdue}</h3><p>Overdue</p></div></div></div>
            </div>
        `;
    }

    // Init
    initialize() {
        const newTaskForm = document.getElementById('new-task-form');
        if (newTaskForm) {
            newTaskForm.addEventListener('submit', this.handleNewTaskSubmit.bind(this));
        }

        const editTaskForm = document.getElementById('edit-task-form');
        if (editTaskForm) {
            editTaskForm.addEventListener('submit', this.handleEditSubmit.bind(this));
        }

        const addCollabForm = document.getElementById('add-collaborator-form');
        if (addCollabForm) {
            addCollabForm.addEventListener('submit', this.handleAddCollaboratorSubmit.bind(this));
        }
    }
}

// Global task manager instance
const taskManager = new TaskManager();
document.addEventListener('DOMContentLoaded', () => {
    taskManager.initialize();
});

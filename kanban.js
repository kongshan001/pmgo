class Kanban {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.columns = {
            todo: document.getElementById('list-todo'),
            progress: document.getElementById('list-progress'),
            done: document.getElementById('list-done')
        };
        this.counts = {
            todo: document.getElementById('count-todo'),
            progress: document.getElementById('count-progress'),
            done: document.getElementById('count-done')
        };
        this.draggedTask = null;
        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.loadTasks();
    }

    setupDragAndDrop() {
        Object.values(this.columns).forEach(column => {
            column.addEventListener('dragover', (e) => this.handleDragOver(e));
            column.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            column.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        const column = e.currentTarget;
        column.classList.remove('drag-over');
        
        if (this.draggedTask) {
            const newStatus = column.id.replace('list-', '');
            const taskId = this.draggedTask.dataset.taskId;
            
            if (storage.update(taskId, { status: newStatus })) {
                this.loadTasks();
            }
        }
    }

    loadTasks() {
        const tasks = storage.getAll();
        const grouped = { todo: [], progress: [], done: [] };
        
        tasks.forEach(taskData => {
            const task = Task.fromJSON(taskData);
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        });

        Object.keys(this.columns).forEach(status => {
            this.renderColumn(status, grouped[status]);
        });
    }

    renderColumn(status, tasks) {
        const column = this.columns[status];
        const countEl = this.counts[status];
        
        column.innerHTML = '';
        countEl.textContent = tasks.length;

        tasks.sort((a, b) => b.updatedAt - a.updatedAt).forEach(task => {
            const card = this.createTaskCard(task);
            column.appendChild(card);
        });
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = `task-card ${task.isOverdue() ? 'overdue' : ''}`;
        card.draggable = true;
        card.dataset.taskId = task.id;

        const tagsHtml = task.tags.map(tag => 
            `<span class="task-tag">${this.escapeHtml(tag)}</span>`
        ).join('');

        const dueClass = task.isOverdue() ? 'overdue' : '';
        const dueText = task.dueDate ? task.formatDate() : '';

        card.innerHTML = `
            <div class="task-header">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <span class="task-priority ${task.getPriorityClass()}">${task.getPriorityLabel()}</span>
            </div>
            ${task.description ? `<div class="task-desc">${this.escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                <div class="task-tags">${tagsHtml}</div>
                ${dueText ? `<div class="task-due ${dueClass}">${dueText}</div>` : ''}
            </div>
        `;

        card.addEventListener('dragstart', (e) => this.handleDragStart(e, card));
        card.addEventListener('dragend', (e) => this.handleDragEnd(e, card));
        card.addEventListener('click', () => this.openTaskEdit(task.id));

        return card;
    }

    handleDragStart(e, card) {
        this.draggedTask = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(e, card) {
        card.classList.remove('dragging');
        this.draggedTask = null;
    }

    openTaskEdit(taskId) {
        const event = new CustomEvent('openTaskModal', { 
            detail: { taskId } 
        });
        document.dispatchEvent(event);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    refresh() {
        this.loadTasks();
    }
}

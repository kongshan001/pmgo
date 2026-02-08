class Modal {
    constructor() {
        this.overlay = document.getElementById('modalOverlay');
        this.form = document.getElementById('taskForm');
        this.titleEl = document.getElementById('modalTitle');
        this.closeBtn = document.getElementById('modalClose');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.deleteBtn = document.getElementById('deleteTaskBtn');
        this.addBtn = document.getElementById('addTaskBtn');
        
        this.inputs = {
            id: document.getElementById('taskId'),
            title: document.getElementById('taskTitle'),
            description: document.getElementById('taskDesc'),
            priority: document.getElementById('taskPriority'),
            dueDate: document.getElementById('taskDueDate'),
            tags: document.getElementById('taskTags')
        };

        this.currentTaskId = null;
        this.init();
    }

    init() {
        this.addBtn.addEventListener('click', () => this.openCreate());
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
        this.deleteBtn.addEventListener('click', () => this.deleteTask());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        document.addEventListener('openTaskModal', (e) => {
            this.openEdit(e.detail.taskId);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    openCreate() {
        this.currentTaskId = null;
        this.resetForm();
        this.titleEl.textContent = '新建任务';
        this.deleteBtn.style.display = 'none';
        this.show();
        this.inputs.title.focus();
    }

    openEdit(taskId) {
        const taskData = storage.getById(taskId);
        if (!taskData) return;

        this.currentTaskId = taskId;
        this.populateForm(taskData);
        this.titleEl.textContent = '编辑任务';
        this.deleteBtn.style.display = 'block';
        this.show();
    }

    show() {
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.resetForm();
    }

    isOpen() {
        return this.overlay.classList.contains('active');
    }

    resetForm() {
        this.form.reset();
        this.inputs.id.value = '';
        this.currentTaskId = null;
    }

    populateForm(taskData) {
        this.inputs.id.value = taskData.id;
        this.inputs.title.value = taskData.title || '';
        this.inputs.description.value = taskData.description || '';
        this.inputs.priority.value = taskData.priority || 'medium';
        this.inputs.dueDate.value = taskData.dueDate || '';
        this.inputs.tags.value = Array.isArray(taskData.tags) 
            ? taskData.tags.join(', ') 
            : '';
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const taskData = {
            title: this.inputs.title.value.trim(),
            description: this.inputs.description.value.trim(),
            priority: this.inputs.priority.value,
            dueDate: this.inputs.dueDate.value,
            tags: this.inputs.tags.value
        };

        if (this.currentTaskId) {
            taskData.id = this.currentTaskId;
            const task = Task.fromJSON(storage.getById(this.currentTaskId));
            Object.assign(task, taskData);
            task.updatedAt = Date.now();
            
            const errors = task.validate();
            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }
            
            storage.update(this.currentTaskId, task.toJSON());
        } else {
            taskData.status = 'todo';
            const task = new Task(taskData);
            
            const errors = task.validate();
            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }
            
            storage.add(task.toJSON());
        }

        this.close();
        this.refreshKanban();
    }

    deleteTask() {
        if (!this.currentTaskId) return;
        
        if (confirm('确定要删除这个任务吗？此操作不可恢复。')) {
            storage.delete(this.currentTaskId);
            this.close();
            this.refreshKanban();
        }
    }

    refreshKanban() {
        const event = new CustomEvent('refreshKanban');
        document.dispatchEvent(event);
    }
}

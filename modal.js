class Modal {
    constructor() {
        this.taskOverlay = document.getElementById('taskModalOverlay');
        this.moduleOverlay = document.getElementById('moduleModalOverlay');
        this.taskForm = document.getElementById('taskForm');
        this.taskTitleEl = document.getElementById('taskModalTitle');
        
        this.taskInputs = {
            id: document.getElementById('taskId'),
            module: document.getElementById('taskModule'),
            title: document.getElementById('taskTitle'),
            description: document.getElementById('taskDesc'),
            status: document.getElementById('taskStatus'),
            priority: document.getElementById('taskPriority'),
            dueDate: document.getElementById('taskDueDate'),
            tags: document.getElementById('taskTags')
        };

        this.currentTaskId = null;
        this.init();
    }

    init() {
        // Task modal events
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openCreate());
        document.getElementById('taskModalClose').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancelTaskBtn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('deleteTaskBtn').addEventListener('click', () => this.deleteTask());
        this.taskForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        this.taskOverlay.addEventListener('click', (e) => {
            if (e.target === this.taskOverlay) this.closeTaskModal();
        });

        // Module modal events
        document.getElementById('manageModulesBtn').addEventListener('click', () => this.openModuleModal());
        document.getElementById('addModuleBtn').addEventListener('click', () => this.openModuleModal());
        document.getElementById('moduleModalClose').addEventListener('click', () => this.closeModuleModal());
        document.getElementById('confirmAddModule').addEventListener('click', () => this.addNewModule());
        
        document.getElementById('newModuleName').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.addNewModule();
        });

        this.moduleOverlay.addEventListener('click', (e) => {
            if (e.target === this.moduleOverlay) this.closeModuleModal();
        });

        document.addEventListener('openTaskModal', (e) => {
            this.openEdit(e.detail.taskId);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isTaskModalOpen()) this.closeTaskModal();
                if (this.isModuleModalOpen()) this.closeModuleModal();
            }
        });
    }

    // Task Modal Methods
    openCreate() {
        this.currentTaskId = null;
        this.resetTaskForm();
        this.populateModuleSelect();
        this.taskTitleEl.textContent = '新建任务';
        document.getElementById('deleteTaskBtn').style.display = 'none';
        this.showTaskModal();
        this.taskInputs.title.focus();
    }

    openEdit(taskId) {
        const taskData = storage.getById(taskId);
        if (!taskData) return;

        this.currentTaskId = taskId;
        this.populateModuleSelect();
        this.populateTaskForm(taskData);
        this.taskTitleEl.textContent = '编辑任务';
        document.getElementById('deleteTaskBtn').style.display = 'block';
        this.showTaskModal();
    }

    showTaskModal() {
        this.taskOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeTaskModal() {
        this.taskOverlay.classList.remove('active');
        document.body.style.overflow = '';
        this.resetTaskForm();
    }

    isTaskModalOpen() {
        return this.taskOverlay.classList.contains('active');
    }

    resetTaskForm() {
        this.taskForm.reset();
        this.taskInputs.id.value = '';
        this.currentTaskId = null;
    }

    populateModuleSelect(selectedModuleId = null) {
        const modules = moduleStorage.getAll().sort((a, b) => a.order - b.order);
        this.taskInputs.module.innerHTML = modules.map(m => 
            `<option value="${m.id}" ${m.id === selectedModuleId ? 'selected' : ''}>${m.name}</option>`
        ).join('');
    }

    populateTaskForm(taskData) {
        this.taskInputs.id.value = taskData.id;
        this.taskInputs.module.value = taskData.moduleId || '';
        this.taskInputs.title.value = taskData.title || '';
        this.taskInputs.description.value = taskData.description || '';
        this.taskInputs.status.value = taskData.status || 'todo';
        this.taskInputs.priority.value = taskData.priority || 'medium';
        this.taskInputs.dueDate.value = taskData.dueDate || '';
        this.taskInputs.tags.value = Array.isArray(taskData.tags) 
            ? taskData.tags.join(', ') 
            : '';
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const taskData = {
            moduleId: this.taskInputs.module.value,
            title: this.taskInputs.title.value.trim(),
            description: this.taskInputs.description.value.trim(),
            status: this.taskInputs.status.value,
            priority: this.taskInputs.priority.value,
            dueDate: this.taskInputs.dueDate.value,
            tags: this.taskInputs.tags.value
        };

        if (this.currentTaskId) {
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
            const task = new Task(taskData);
            
            const errors = task.validate();
            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }
            
            storage.add(task.toJSON());
        }

        this.closeTaskModal();
        this.refreshKanban();
    }

    deleteTask() {
        if (!this.currentTaskId) return;
        
        if (confirm('确定要删除这个任务吗？此操作不可恢复。')) {
            storage.delete(this.currentTaskId);
            this.closeTaskModal();
            this.refreshKanban();
        }
    }

    // Module Modal Methods
    openModuleModal() {
        this.renderModuleList();
        this.showModuleModal();
    }

    showModuleModal() {
        this.moduleOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('newModuleName').focus();
    }

    closeModuleModal() {
        this.moduleOverlay.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('newModuleName').value = '';
    }

    isModuleModalOpen() {
        return this.moduleOverlay.classList.contains('active');
    }

    renderModuleList() {
        const container = document.getElementById('modulesList');
        const modules = moduleStorage.getAll().sort((a, b) => a.order - b.order);
        
        container.innerHTML = modules.map(m => `
            <div class="module-item" data-module-id="${m.id}">
                <div class="module-item-color" style="background: ${m.color}"></div>
                <span class="module-item-name">${m.name}</span>
                <div class="module-item-actions">
                    <button class="btn-icon" data-action="edit" title="编辑">✏️</button>
                    <button class="btn-icon" data-action="delete" title="删除">🗑️</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.module-item').forEach(item => {
            const moduleId = item.dataset.moduleId;
            
            item.querySelector('[data-action="edit"]').addEventListener('click', () => {
                const nameSpan = item.querySelector('.module-item-name');
                const newName = prompt('请输入新模块名称:', nameSpan.textContent);
                if (newName && newName.trim()) {
                    moduleStorage.update(moduleId, { name: newName.trim() });
                    this.renderModuleList();
                    this.refreshKanban();
                }
            });

            item.querySelector('[data-action="delete"]').addEventListener('click', () => {
                const module = moduleStorage.getById(moduleId);
                if (confirm(`确定要删除模块"${module.name}"吗？该模块下的所有任务也会被删除。`)) {
                    const tasks = storage.getByModule(moduleId);
                    tasks.forEach(task => storage.delete(task.id));
                    moduleStorage.delete(moduleId);
                    this.renderModuleList();
                    this.refreshKanban();
                }
            });
        });
    }

    addNewModule() {
        const input = document.getElementById('newModuleName');
        const name = input.value.trim();
        
        if (!name) {
            alert('请输入模块名称');
            return;
        }

        const module = new Module({ name });
        moduleStorage.add(module.toJSON());
        input.value = '';
        this.renderModuleList();
        this.refreshKanban();
    }

    refreshKanban() {
        const event = new CustomEvent('refreshKanban');
        document.dispatchEvent(event);
    }
}

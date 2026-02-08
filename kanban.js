class Kanban {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.draggedTask = null;
        this.draggedModule = null;
        this.init();
    }

    init() {
        moduleStorage.initDefault();
        this.render();
        this.setupGlobalEvents();
    }

    render() {
        this.container.innerHTML = '';
        const modules = moduleStorage.getAll().sort((a, b) => a.order - b.order);
        
        modules.forEach(moduleData => {
            const moduleEl = this.createModuleElement(moduleData);
            this.container.appendChild(moduleEl);
        });
    }

    createModuleElement(moduleData) {
        const moduleEl = document.createElement('div');
        moduleEl.className = 'module-card';
        moduleEl.dataset.moduleId = moduleData.id;
        moduleEl.draggable = true;

        const tasks = storage.getByModule(moduleData.id);
        const grouped = { todo: [], progress: [], done: [] };
        tasks.forEach(task => {
            if (grouped[task.status]) grouped[task.status].push(task);
        });

        moduleEl.innerHTML = `
            <div class="module-header">
                <div class="module-title-wrapper">
                    <div class="module-color" style="background: ${moduleData.color}"></div>
                    <div class="module-title" contenteditable="false" data-module-id="${moduleData.id}">${this.escapeHtml(moduleData.name)}</div>
                </div>
                <div class="module-actions">
                    <button class="btn-icon" data-action="edit-name" title="重命名">✏️</button>
                    <button class="btn-icon" data-action="delete" title="删除">🗑️</button>
                </div>
            </div>
            <div class="module-content">
                ${this.createStatusColumn('todo', '待规划', grouped.todo, moduleData.id)}
                ${this.createStatusColumn('progress', '推进中', grouped.progress, moduleData.id)}
                ${this.createStatusColumn('done', '已完成', grouped.done, moduleData.id)}
            </div>
        `;

        this.setupModuleEvents(moduleEl, moduleData);
        this.setupDragAndDrop(moduleEl, moduleData.id);

        return moduleEl;
    }

    createStatusColumn(status, title, tasks, moduleId) {
        const tasksHtml = tasks
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map(task => this.createTaskCardHtml(task))
            .join('');

        return `
            <div class="status-column" data-status="${status}">
                <div class="status-header">
                    <span>${title}</span>
                    <span class="status-count">${tasks.length}</span>
                </div>
                <div class="task-list" data-status="${status}" data-module-id="${moduleId}">
                    ${tasksHtml}
                </div>
            </div>
        `;
    }

    createTaskCardHtml(task) {
        const taskObj = Task.fromJSON(task);
        const tagsHtml = taskObj.tags.map(tag => 
            `<span class="task-tag">${this.escapeHtml(tag)}</span>`
        ).join('');
        
        const dueClass = taskObj.isOverdue() ? 'overdue' : '';
        const dueText = taskObj.dueDate ? taskObj.formatDate() : '';

        return `
            <div class="task-card ${dueClass}" data-task-id="${task.id}" draggable="true">
                <div class="task-header">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <span class="task-priority ${taskObj.getPriorityClass()}">${taskObj.getPriorityLabel()}</span>
                </div>
                ${task.description ? `<div class="task-desc">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <div class="task-tags">${tagsHtml}</div>
                    ${dueText ? `<div class="task-due ${dueClass}">${dueText}</div>` : ''}
                </div>
            </div>
        `;
    }

    setupModuleEvents(moduleEl, moduleData) {
        const titleEl = moduleEl.querySelector('.module-title');
        
        moduleEl.querySelector('[data-action="edit-name"]').addEventListener('click', () => {
            titleEl.contentEditable = true;
            titleEl.focus();
            const range = document.createRange();
            range.selectNodeContents(titleEl);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });

        titleEl.addEventListener('blur', () => {
            titleEl.contentEditable = false;
            const newName = titleEl.textContent.trim();
            if (newName && newName !== moduleData.name) {
                moduleStorage.update(moduleData.id, { name: newName });
            }
        });

        titleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleEl.blur();
            }
        });

        moduleEl.querySelector('[data-action="delete"]').addEventListener('click', () => {
            if (confirm(`确定要删除模块"${moduleData.name}"吗？该模块下的所有任务也会被删除。`)) {
                const tasks = storage.getByModule(moduleData.id);
                tasks.forEach(task => storage.delete(task.id));
                moduleStorage.delete(moduleData.id);
                this.render();
            }
        });

        moduleEl.addEventListener('dragstart', (e) => {
            this.draggedModule = moduleEl;
            moduleEl.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        moduleEl.addEventListener('dragend', () => {
            moduleEl.classList.remove('dragging');
            this.draggedModule = null;
            this.updateModuleOrder();
        });
    }

    setupDragAndDrop(moduleEl, moduleId) {
        const taskLists = moduleEl.querySelectorAll('.task-list');
        
        taskLists.forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                list.classList.add('drag-over');
            });

            list.addEventListener('dragleave', () => {
                list.classList.remove('drag-over');
            });

            list.addEventListener('drop', (e) => {
                e.preventDefault();
                list.classList.remove('drag-over');
                
                if (this.draggedTask) {
                    const newStatus = list.dataset.status;
                    const newModuleId = list.dataset.moduleId;
                    const taskId = this.draggedTask.dataset.taskId;
                    
                    const updates = { status: newStatus };
                    if (newModuleId) updates.moduleId = newModuleId;
                    
                    if (storage.update(taskId, updates)) {
                        this.render();
                    }
                }
            });
        });

        const taskCards = moduleEl.querySelectorAll('.task-card');
        taskCards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                this.draggedTask = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.draggedTask = null;
            });

            card.addEventListener('click', () => {
                const event = new CustomEvent('openTaskModal', { 
                    detail: { taskId: card.dataset.taskId } 
                });
                document.dispatchEvent(event);
            });
        });
    }

    updateModuleOrder() {
        const modules = Array.from(this.container.querySelectorAll('.module-card'));
        const orderedIds = modules.map(el => el.dataset.moduleId);
        moduleStorage.reorder(orderedIds);
    }

    setupGlobalEvents() {
        this.container.addEventListener('dragover', (e) => {
            if (this.draggedModule) {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(this.container, e.clientX);
                if (afterElement) {
                    this.container.insertBefore(this.draggedModule, afterElement);
                } else {
                    this.container.appendChild(this.draggedModule);
                }
            }
        });
    }

    getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.module-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    refresh() {
        this.render();
    }
}

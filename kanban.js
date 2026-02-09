class Kanban {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.draggedTask = null;
        this.init();
    }

    async init() {
        await moduleStorage.initDefault();
        await this.render();
    }

    async render() {
        this.container.innerHTML = '';
        const modules = await moduleStorage.getAll();
        modules.sort((a, b) => a.order - b.order);
        
        for (const moduleData of modules) {
            const moduleRow = await this.createModuleRow(moduleData);
            this.container.appendChild(moduleRow);
        }
    }

    async createModuleRow(moduleData) {
        const row = document.createElement('div');
        row.className = 'module-row';
        row.dataset.moduleId = moduleData.id;

        const tasks = await storage.getByModule(moduleData.id);
        const grouped = { todo: [], progress: [], done: [] };
        tasks.forEach(task => {
            if (grouped[task.status]) grouped[task.status].push(task);
        });

        const totalTasks = tasks.length;
        const inProgressTasks = grouped.progress.length;
        const doneTasks = grouped.done.length;

        row.innerHTML = `
            <div class="module-row-header">
                <div class="module-color" style="background: ${moduleData.color}"></div>
                <div class="module-title" contenteditable="false" data-module-id="${moduleData.id}">${this.escapeHtml(moduleData.name)}</div>
                <div class="module-stats">
                    <span>总计: ${totalTasks}</span>
                    <span>进行中: ${inProgressTasks}</span>
                    <span>已完成: ${doneTasks}</span>
                </div>
                <button class="btn-icon" data-action="delete-module" title="删除模块">🗑️</button>
            </div>
            <div class="module-row-content">
                ${this.createStatusColumn('todo', '待规划', grouped.todo, moduleData.id)}
                ${this.createStatusColumn('progress', '推进中', grouped.progress, moduleData.id)}
                ${this.createStatusColumn('done', '已完成', grouped.done, moduleData.id)}
            </div>
        `;

        this.setupModuleEvents(row, moduleData);
        this.setupDragAndDrop(row, moduleData.id);

        return row;
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

    setupModuleEvents(row, moduleData) {
        const titleEl = row.querySelector('.module-title');
        
        titleEl.addEventListener('click', () => {
            titleEl.contentEditable = true;
            titleEl.focus();
            const range = document.createRange();
            range.selectNodeContents(titleEl);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });

        titleEl.addEventListener('blur', async () => {
            titleEl.contentEditable = false;
            const newName = titleEl.textContent.trim();
            if (newName && newName !== moduleData.name) {
                await moduleStorage.update(moduleData.id, { name: newName });
            }
        });

        titleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleEl.blur();
            }
        });

        row.querySelector('[data-action="delete-module"]').addEventListener('click', async () => {
            if (confirm(`确定要删除模块"${moduleData.name}"吗？该模块下的所有任务也会被删除。`)) {
                const tasks = await storage.getByModule(moduleData.id);
                for (const task of tasks) {
                    await storage.delete(task.id);
                }
                await moduleStorage.delete(moduleData.id);
                await this.render();
            }
        });
    }

    setupDragAndDrop(row, moduleId) {
        const taskLists = row.querySelectorAll('.task-list');
        
        taskLists.forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                list.classList.add('drag-over');
            });

            list.addEventListener('dragleave', () => {
                list.classList.remove('drag-over');
            });

            list.addEventListener('drop', async (e) => {
                e.preventDefault();
                list.classList.remove('drag-over');
                
                if (this.draggedTask) {
                    const newStatus = list.dataset.status;
                    const newModuleId = list.dataset.moduleId;
                    const taskId = this.draggedTask.dataset.taskId;
                    
                    const updates = { status: newStatus };
                    if (newModuleId && newModuleId !== 'undefined') {
                        updates.moduleId = newModuleId;
                    }
                    
                    await storage.update(taskId, updates);
                    await this.render();
                }
            });
        });

        const taskCards = row.querySelectorAll('.task-card');
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async refresh() {
        await this.render();
    }
}

class Modal {
    constructor() {
        this.taskOverlay = document.getElementById('taskModalOverlay');
        this.moduleOverlay = document.getElementById('moduleModalOverlay');
        this.configOverlay = document.getElementById('configModalOverlay');
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
        console.log('[Modal] 初始化Modal');
        
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
        console.log('[Modal] 绑定模块管理按钮事件');
        const manageBtn = document.getElementById('manageModulesBtn');
        console.log('[Modal] manageModulesBtn:', manageBtn);
        manageBtn.addEventListener('click', () => this.openModuleModal());
        
        const closeBtn = document.getElementById('moduleModalClose');
        console.log('[Modal] moduleModalClose:', closeBtn);
        closeBtn.addEventListener('click', () => this.closeModuleModal());
        
        const addBtn = document.getElementById('confirmAddModule');
        console.log('[Modal] confirmAddModule:', addBtn);
        console.log('[Modal] confirmAddModule类型:', addBtn.type);
        console.log('[Modal] confirmAddModule父节点:', addBtn.parentElement.tagName);
        addBtn.addEventListener('click', (e) => {
            console.log('[Modal] confirmAddModule被点击!', e);
            e.preventDefault();
            e.stopPropagation();
            this.addNewModule();
        });
        
        document.getElementById('newModuleName').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.addNewModule();
        });

        this.moduleOverlay.addEventListener('click', (e) => {
            if (e.target === this.moduleOverlay) this.closeModuleModal();
        });

        // Config modal events
        document.getElementById('configBtn').addEventListener('click', () => this.openConfigModal());
        document.getElementById('configModalClose').addEventListener('click', () => this.closeConfigModal());
        document.getElementById('cancelConfigBtn').addEventListener('click', () => this.closeConfigModal());
        document.getElementById('saveConfigBtn').addEventListener('click', () => this.saveConfig());
        document.getElementById('storageType').addEventListener('change', (e) => this.toggleCloudSettings(e.target.value));
        
        this.configOverlay.addEventListener('click', (e) => {
            if (e.target === this.configOverlay) this.closeConfigModal();
        });

        document.addEventListener('openTaskModal', (e) => {
            this.openEdit(e.detail.taskId);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isTaskModalOpen()) this.closeTaskModal();
                if (this.isModuleModalOpen()) this.closeModuleModal();
                if (this.isConfigModalOpen()) this.closeConfigModal();
            }
        });
        
        console.log('[Modal] Modal初始化完成');
    }

    // Task Modal Methods
    async openCreate() {
        this.currentTaskId = null;
        this.resetTaskForm();
        await this.populateModuleSelect();
        this.taskTitleEl.textContent = '新建任务';
        document.getElementById('deleteTaskBtn').style.display = 'none';
        this.showTaskModal();
        this.taskInputs.title.focus();
    }

    async openEdit(taskId) {
        const taskData = await storage.getById(taskId);
        if (!taskData) return;

        this.currentTaskId = taskId;
        await this.populateModuleSelect();
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

    async populateModuleSelect(selectedModuleId = null) {
        const modules = await moduleStorage.getAll();
        modules.sort((a, b) => a.order - b.order);
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

    async handleSubmit(e) {
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
            const taskDataFromStorage = await storage.getById(this.currentTaskId);
            const task = Task.fromJSON(taskDataFromStorage);
            Object.assign(task, taskData);
            task.updatedAt = Date.now();
            
            const errors = task.validate();
            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }
            
            await storage.update(this.currentTaskId, task.toJSON());
        } else {
            const task = new Task(taskData);
            
            const errors = task.validate();
            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }
            
            await storage.add(task.toJSON());
        }

        this.closeTaskModal();
        this.refreshKanban();
    }

    async deleteTask() {
        if (!this.currentTaskId) return;
        
        if (confirm('确定要删除这个任务吗？此操作不可恢复。')) {
            await storage.delete(this.currentTaskId);
            this.closeTaskModal();
            this.refreshKanban();
        }
    }

    // Module Modal Methods
    async openModuleModal() {
        await this.renderModuleList();
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

    async renderModuleList() {
        const container = document.getElementById('modulesList');
        const modules = await moduleStorage.getAll();
        modules.sort((a, b) => a.order - b.order);
        console.log('[renderModuleList] 模块列表:', modules);
        
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
            
            item.querySelector('[data-action="edit"]').addEventListener('click', async () => {
                const nameSpan = item.querySelector('.module-item-name');
                const newName = prompt('请输入新模块名称:', nameSpan.textContent);
                if (newName && newName.trim()) {
                    await moduleStorage.update(moduleId, { name: newName.trim() });
                    await this.renderModuleList();
                    this.refreshKanban();
                }
            });

            item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
                const module = await moduleStorage.getById(moduleId);
                if (confirm(`确定要删除模块"${module.name}"吗？该模块下的所有任务也会被删除。`)) {
                    const tasks = await storage.getByModule(moduleId);
                    for (const task of tasks) {
                        await storage.delete(task.id);
                    }
                    await moduleStorage.delete(moduleId);
                    await this.renderModuleList();
                    this.refreshKanban();
                }
            });
        });
    }

    async addNewModule() {
        try {
            console.log('[addNewModule] === 开始添加模块 ===');
            
            const input = document.getElementById('newModuleName');
            console.log('[addNewModule] 输入框元素:', input);
            
            if (!input) {
                console.error('[addNewModule] 输入框未找到!');
                alert('错误：输入框未找到');
                return;
            }
            
            const name = input.value.trim();
            console.log('[addNewModule] 模块名称:', name);
            
            if (!name) {
                alert('请输入模块名称');
                return;
            }

            console.log('[addNewModule] 准备创建Module对象');
            const module = new Module({ name });
            const moduleJson = module.toJSON();
            console.log('[addNewModule] 创建的模块对象:', moduleJson);
            
            console.log('[addNewModule] 准备调用moduleStorage.add');
            const result = await moduleStorage.add(moduleJson);
            console.log('[addNewModule] moduleStorage.add返回值:', result);
            const modules = await moduleStorage.getAll();
            console.log('[addNewModule] 保存后的模块列表:', modules);
            
            if (!result) {
                alert('保存失败，请重试');
                return;
            }
            
            input.value = '';
            console.log('[addNewModule] 准备刷新模块列表');
            await this.renderModuleList();
            console.log('[addNewModule] 准备刷新看板');
            this.refreshKanban();
            
            console.log('[addNewModule] === 添加模块完成 ===');
        } catch (error) {
            console.error('[addNewModule] 发生错误:', error);
            console.error('[addNewModule] 错误堆栈:', error.stack);
            alert('添加模块时发生错误: ' + error.message);
        }
    }

    refreshKanban() {
        const event = new CustomEvent('refreshKanban');
        document.dispatchEvent(event);
    }

    // Config Modal Methods
    openConfigModal() {
        const storageTypeSelect = document.getElementById('storageType');
        const apiKeyInput = document.getElementById('jsonBinApiKey');
        const binIdInput = document.getElementById('jsonBinBinId');
        
        storageTypeSelect.value = config.storageType;
        apiKeyInput.value = config.jsonBinConfig.apiKey;
        binIdInput.value = config.jsonBinConfig.binId;
        
        this.toggleCloudSettings(config.storageType);
        this.showConfigModal();
    }

    showConfigModal() {
        this.configOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeConfigModal() {
        this.configOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    isConfigModalOpen() {
        return this.configOverlay.classList.contains('active');
    }

    toggleCloudSettings(storageType) {
        const cloudSettings = document.getElementById('cloudSettings');
        cloudSettings.style.display = storageType === 'cloud' ? 'block' : 'none';
    }

    saveConfig() {
        const storageType = document.getElementById('storageType').value;
        const apiKey = document.getElementById('jsonBinApiKey').value.trim();
        const binId = document.getElementById('jsonBinBinId').value.trim();
        
        if (storageType === 'cloud' && (!apiKey || !binId)) {
            alert('使用云端存储需要填写 API Key 和 Bin ID');
            return;
        }
        
        config.storageType = storageType;
        config.setJsonBinConfig(apiKey, binId);
        
        alert('配置已保存，刷新页面后生效');
        this.closeConfigModal();
    }
}

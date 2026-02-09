class Storage {
    constructor() {
        this.key = 'task_manager_data_v2';
        this.adapter = null;
        this.init();
    }

    init() {
        this.adapter = StorageFactory.create(this.key);
    }

    async getAll() {
        return await this.adapter.getAll();
    }

    async save(tasks) {
        return await this.adapter.save(tasks);
    }

    async add(task) {
        return await this.adapter.add(task);
    }

    async update(id, updates) {
        const taskWithTimestamp = { ...updates, updatedAt: Date.now() };
        return await this.adapter.update(id, taskWithTimestamp);
    }

    async delete(id) {
        return await this.adapter.delete(id);
    }

    async getById(id) {
        const tasks = await this.getAll();
        return tasks.find(t => t.id === id);
    }

    async getByStatus(status, moduleId = null) {
        const tasks = await this.getAll();
        let filtered = tasks.filter(t => t.status === status);
        if (moduleId) {
            filtered = filtered.filter(t => t.moduleId === moduleId);
        }
        return filtered;
    }

    async getByModule(moduleId) {
        const tasks = await this.getAll();
        return tasks.filter(t => t.moduleId === moduleId);
    }

    async moveToModule(taskId, moduleId) {
        return await this.update(taskId, { moduleId });
    }

    async export() {
        const data = {
            modules: await moduleStorage.getAll(),
            tasks: await this.getAll()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.modules && Array.isArray(data.modules)) {
                await moduleStorage.save(data.modules);
            }
            if (data.tasks && Array.isArray(data.tasks)) {
                return await this.save(data.tasks);
            }
            return false;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }

    async clear() {
        await this.adapter.clear();
    }
}

const storage = new Storage();

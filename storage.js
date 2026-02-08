class Storage {
    constructor() {
        this.key = 'task_manager_data_v2';
    }

    getAll() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取数据失败:', e);
            return [];
        }
    }

    save(tasks) {
        try {
            localStorage.setItem(this.key, JSON.stringify(tasks));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    }

    add(task) {
        const tasks = this.getAll();
        tasks.push(task);
        return this.save(tasks);
    }

    update(id, updates) {
        const tasks = this.getAll();
        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) return false;
        tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };
        return this.save(tasks);
    }

    delete(id) {
        const tasks = this.getAll();
        const filtered = tasks.filter(t => t.id !== id);
        return this.save(filtered);
    }

    getById(id) {
        return this.getAll().find(t => t.id === id);
    }

    getByStatus(status, moduleId = null) {
        let tasks = this.getAll().filter(t => t.status === status);
        if (moduleId) {
            tasks = tasks.filter(t => t.moduleId === moduleId);
        }
        return tasks;
    }

    getByModule(moduleId) {
        return this.getAll().filter(t => t.moduleId === moduleId);
    }

    moveToModule(taskId, moduleId) {
        return this.update(taskId, { moduleId });
    }

    export() {
        const data = {
            modules: moduleStorage.getAll(),
            tasks: this.getAll()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.modules && Array.isArray(data.modules)) {
                moduleStorage.save(data.modules);
            }
            if (data.tasks && Array.isArray(data.tasks)) {
                return this.save(data.tasks);
            }
            return false;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }

    clear() {
        localStorage.removeItem(this.key);
        localStorage.removeItem('task_manager_modules');
    }
}

const storage = new Storage();

class Module {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '新模块';
        this.order = data.order ?? 0;
        this.color = data.color || this.getRandomColor();
        this.createdAt = data.createdAt || Date.now();
    }

    generateId() {
        return 'mod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getRandomColor() {
        const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    validate() {
        const errors = [];
        if (!this.name || this.name.trim() === '') {
            errors.push('模块名称不能为空');
        }
        return errors;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            order: this.order,
            color: this.color,
            createdAt: this.createdAt
        };
    }

    static fromJSON(json) {
        return new Module(json);
    }
}

class ModuleStorage {
    constructor() {
        this.key = 'task_manager_modules';
        this.defaultModules = [
            { name: '前端开发', order: 0 },
            { name: '后端开发', order: 1 },
            { name: '测试', order: 2 }
        ];
    }

    initDefault() {
        if (this.getAll().length === 0) {
            const modules = this.defaultModules.map((m, i) => {
                const mod = new Module(m);
                mod.order = i;
                return mod.toJSON();
            });
            this.save(modules);
        }
    }

    getAll() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取模块数据失败:', e);
            return [];
        }
    }

    save(modules) {
        try {
            localStorage.setItem(this.key, JSON.stringify(modules));
            return true;
        } catch (e) {
            console.error('保存模块数据失败:', e);
            return false;
        }
    }

    add(module) {
        const modules = this.getAll();
        module.order = modules.length;
        modules.push(module);
        return this.save(modules);
    }

    update(id, updates) {
        const modules = this.getAll();
        const index = modules.findIndex(m => m.id === id);
        if (index === -1) return false;
        modules[index] = { ...modules[index], ...updates };
        return this.save(modules);
    }

    delete(id) {
        const modules = this.getAll().filter(m => m.id !== id);
        modules.forEach((m, i) => m.order = i);
        return this.save(modules);
    }

    getById(id) {
        return this.getAll().find(m => m.id === id);
    }

    reorder(orderedIds) {
        const modules = this.getAll();
        const moduleMap = new Map(modules.map(m => [m.id, m]));
        const reordered = orderedIds.map((id, index) => {
            const m = moduleMap.get(id);
            if (m) m.order = index;
            return m;
        }).filter(Boolean);
        return this.save(reordered);
    }
}

const moduleStorage = new ModuleStorage();

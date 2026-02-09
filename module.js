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
        this.adapter = null;
        this.init();
    }

    init() {
        this.adapter = StorageFactory.create(this.key);
    }

    async initDefault() {
        const modules = await this.getAll();
        if (modules.length === 0) {
            const defaultModules = this.defaultModules.map((m, i) => {
                const mod = new Module(m);
                mod.order = i;
                return mod.toJSON();
            });
            await this.save(defaultModules);
        }
    }

    async getAll() {
        return await this.adapter.getAll();
    }

    async save(modules) {
        return await this.adapter.save(modules);
    }

    async add(module) {
        console.log('[moduleStorage.add] 添加模块:', module);
        const modules = await this.getAll();
        console.log('[moduleStorage.add] 现有模块数量:', modules.length);
        module.order = modules.length;
        const result = await this.adapter.add(module);
        console.log('[moduleStorage.add] 添加结果:', result);
        return result !== null;
    }

    async update(id, updates) {
        return await this.adapter.update(id, updates);
    }

    async delete(id) {
        const modules = await this.getAll();
        const filtered = modules.filter(m => m.id !== id);
        filtered.forEach((m, i) => m.order = i);
        return await this.adapter.save(filtered);
    }

    async getById(id) {
        const modules = await this.getAll();
        return modules.find(m => m.id === id);
    }

    async reorder(orderedIds) {
        const modules = await this.getAll();
        const moduleMap = new Map(modules.map(m => [m.id, m]));
        const reordered = orderedIds.map((id, index) => {
            const m = moduleMap.get(id);
            if (m) m.order = index;
            return m;
        }).filter(Boolean);
        return await this.save(reordered);
    }
}

const moduleStorage = new ModuleStorage();

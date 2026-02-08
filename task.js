class Task {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.status = data.status || 'todo';
        this.priority = data.priority || 'medium';
        this.dueDate = data.dueDate || '';
        this.tags = this.parseTags(data.tags);
        this.moduleId = data.moduleId || null;
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = data.updatedAt || Date.now();
    }

    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    parseTags(tags) {
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string') {
            return tags.split(/[,，]/).map(t => t.trim()).filter(t => t);
        }
        return [];
    }

    validate() {
        const errors = [];
        if (!this.title || this.title.trim() === '') {
            errors.push('任务标题不能为空');
        }
        if (!['todo', 'progress', 'done'].includes(this.status)) {
            errors.push('状态值无效');
        }
        if (!['low', 'medium', 'high'].includes(this.priority)) {
            errors.push('优先级值无效');
        }
        return errors;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: this.status,
            priority: this.priority,
            dueDate: this.dueDate,
            tags: this.tags,
            moduleId: this.moduleId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(json) {
        return new Task(json);
    }

    getPriorityLabel() {
        const labels = { low: '低', medium: '中', high: '高' };
        return labels[this.priority] || '中';
    }

    getPriorityClass() {
        return `priority-${this.priority}`;
    }

    isOverdue() {
        if (!this.dueDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return this.dueDate < today && this.status !== 'done';
    }

    formatDate() {
        if (!this.dueDate) return '';
        const date = new Date(this.dueDate);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

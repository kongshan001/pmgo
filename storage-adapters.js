class LocalStorageAdapter {
    constructor(key) {
        this.key = key;
    }

    async getAll() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    async save(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
        return true;
    }

    async add(item) {
        const items = await this.getAll();
        items.push(item);
        await this.save(items);
        return item;
    }

    async update(id, updates) {
        const items = await this.getAll();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            await this.save(items);
            return items[index];
        }
        return null;
    }

    async delete(id) {
        const items = await this.getAll();
        const filtered = items.filter(item => item.id !== id);
        await this.save(filtered);
        return true;
    }

    async clear() {
        localStorage.removeItem(this.key);
        return true;
    }
}

class JsonBinAdapter {
    constructor(binKey) {
        this.binKey = binKey;
    }

    async getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Master-Key': config.jsonBinConfig.apiKey
        };
    }

    async getAll() {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${config.jsonBinConfig.binId}/latest`, {
                headers: await this.getHeaders()
            });
            const data = await response.json();
            return data.record[this.binKey] || [];
        } catch (error) {
            console.error('[JsonBin] 获取数据失败:', error);
            return [];
        }
    }

    async save(data) {
        try {
            // 先获取完整数据，避免覆盖其他字段
            const response = await fetch(`https://api.jsonbin.io/v3/b/${config.jsonBinConfig.binId}/latest`, {
                headers: await this.getHeaders()
            });
            const fullData = await response.json();
            
            // 更新对应字段
            fullData.record[this.binKey] = data;
            
            // 保存完整数据
            const saveResponse = await fetch(`https://api.jsonbin.io/v3/b/${config.jsonBinConfig.binId}`, {
                method: 'PUT',
                headers: await this.getHeaders(),
                body: JSON.stringify(fullData.record)
            });
            
            return saveResponse.ok;
        } catch (error) {
            console.error('[JsonBin] 保存失败:', error);
            return false;
        }
    }

    async add(item) {
        const items = await this.getAll();
        items.push(item);
        return await this.save(items) ? item : null;
    }

    async update(id, updates) {
        const items = await this.getAll();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            return await this.save(items) ? items[index] : null;
        }
        return null;
    }

    async delete(id) {
        const items = await this.getAll();
        const filtered = items.filter(item => item.id !== id);
        return await this.save(filtered);
    }

    async clear() {
        return await this.save([]);
    }
}

class StorageFactory {
    static create(binKey) {
        if (config.storageType === 'cloud' && config.isCloudEnabled()) {
            console.log(`[Storage] 使用云端存储 (JSONBin): ${binKey}`);
            return new JsonBinAdapter(binKey);
        }
        console.log(`[Storage] 使用本地存储: ${binKey}`);
        return new LocalStorageAdapter(binKey);
    }
}

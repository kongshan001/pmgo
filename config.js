class Config {
    constructor() {
        this.storageKey = 'task_manager_config';
        this.config = this.load();
    }

    load() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
        return this.getDefault();
    }

    getDefault() {
        return {
            storageType: 'cloud',
            jsonBin: {
                apiKey: '$2a$10$YlR6MS2kzymOxzGqdT/ye.7SlZ.2/r4in64Wtw0JgpQ0gXI/UU3Ia',
                binId: '6989c2d3ae596e708f1d51ea'
            }
        };
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    }

    get storageType() {
        return this.config.storageType;
    }

    set storageType(type) {
        this.config.storageType = type;
        this.save();
    }

    get jsonBinConfig() {
        return this.config.jsonBin;
    }

    setJsonBinConfig(apiKey, binId) {
        this.config.jsonBin = { apiKey, binId };
        this.save();
    }

    isCloudEnabled() {
        return this.config.storageType === 'cloud' && 
               this.config.jsonBin.apiKey && 
               this.config.jsonBin.binId;
    }
}

const config = new Config();

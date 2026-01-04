import * as fs from 'fs';
import * as path from 'path';

const configPath = path.resolve('config.json');

interface GuildConfig {
    prefix?: string;
}

interface ConfigData {
    [guildId: string]: GuildConfig;
}

export class ConfigManager {
    private static data: ConfigData = {};

    static load() {
        if (!fs.existsSync(configPath)) {
            this.data = {};
            this.save();
            return;
        }
        try {
            const raw = fs.readFileSync(configPath, 'utf-8');
            this.data = JSON.parse(raw);
        } catch (e) {
            console.error('Failed to load config.json', e);
            this.data = {};
        }
    }

    static save() {
        fs.writeFileSync(configPath, JSON.stringify(this.data, null, 2));
    }

    static getPrefix(guildId: string): string {
        if (!this.data[guildId]) return process.env.PREFIX || '?';
        return this.data[guildId].prefix || process.env.PREFIX || '?';
    }

    static setPrefix(guildId: string, prefix: string) {
        if (!this.data[guildId]) this.data[guildId] = {};
        this.data[guildId].prefix = prefix;
        this.save();
    }
}

// Initial load
ConfigManager.load();

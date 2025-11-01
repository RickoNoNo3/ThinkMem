import * as fs from 'fs';
import * as path from 'path';
import { Memory, RawMemory, ListMemory } from '../types';
import { RawMemory as RawMemoryClass } from '../memory/RawMemory';
import { VERSION } from '../version';
import { logger } from '../utils/logger';

export interface DatabaseSchema {
  memories: Map<string, Memory>;
  secrets: Map<string, {
    secret: string;
    createdAt: string;
    expiresAt: string;
  }>;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export class JsonStorage {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor(dbPath: string) {
    try {
      logger.debug(`Initializing JsonStorage with database: ${dbPath}`);

      this.dbPath = dbPath;
      this.data = {
        memories: new Map(),
        secrets: new Map(),
        version: VERSION,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.load();
      logger.debug('JsonStorage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize JsonStorage', error);
      throw error;
    }
  }

  /**
   * 加载数据库
   */
  private async load(): Promise<void> {
    try {
      if (fs.existsSync(this.dbPath)) {
        const rawData = fs.readFileSync(this.dbPath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        // 转换memories对象为Map
        const memories = new Map<string, Memory>();
        if (jsonData.memories) {
          Object.entries(jsonData.memories).forEach(([key, value]: [string, any]) => {
            const memory = this.deserializeMemory(value);
            if (memory) {
              memories.set(key, memory);
            }
          });
        }

        // 转换secrets对象为Map
        const secrets = new Map<string, {
          secret: string;
          createdAt: string;
          expiresAt: string;
        }>();
        if (jsonData.secrets) {
          Object.entries(jsonData.secrets).forEach(([key, value]: [string, any]) => {
            if (value.secret && value.createdAt && value.expiresAt) {
              secrets.set(key, {
                secret: value.secret,
                createdAt: value.createdAt,
                expiresAt: value.expiresAt
              });
            }
          });
        }

        this.data = {
          memories,
          secrets,
          version: jsonData.version || VERSION,
          createdAt: jsonData.createdAt || new Date().toISOString(),
          updatedAt: jsonData.updatedAt || new Date().toISOString()
        };
      } else {
        // 如果文件不存在，创建新数据库
        await this.save();
      }
    } catch (error) {
      // 如果加载失败，创建新数据库
      this.data = {
        memories: new Map(),
        secrets: new Map(),
        version: VERSION,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  async forceSave() {
    await this.save();
  }

  /**
   * 保存数据库
   */
  private async save(): Promise<void> {
    try {
      logger.debug('Saving database to file');

      // 确保目录存在
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        logger.debug(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }

      // 转换Map为普通对象以便序列化
      const memoriesObj: Record<string, Memory> = {};
      this.data.memories.forEach((value, key) => {
        memoriesObj[key] = value;
      });

      // 转换secrets Map为普通对象以便序列化
      const secretsObj: Record<string, {
        secret: string;
        createdAt: string;
        expiresAt: string;
      }> = {};
      this.data.secrets.forEach((value, key) => {
        secretsObj[key] = value;
      });

      const jsonData = {
        memories: memoriesObj,
        secrets: secretsObj,
        version: this.data.version,
        createdAt: this.data.createdAt,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(this.dbPath, JSON.stringify(jsonData, null, 2), 'utf-8');
      logger.debug('Database saved successfully');
    } catch (error) {
      logger.error('Database save failed', error);
      throw new Error(`Database save failed: ${error}`);
    }
  }

  /**
   * 反序列化Memory对象
   */
  private deserializeMemory(data: any): Memory | null {
    try {
      if (!data.type) {
        return null;
      }

      switch (data.type) {
        case 'raw':
          return RawMemoryClass.fromJSON(data);
        case 'list':
          return {
            name: data.name,
            type: 'list',
            description: data.description,
            list: (data.list || []).map((item: any) => RawMemoryClass.fromJSON(item)),
            role: data.role || 'array'
          } as ListMemory;
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * 添加Memory
   */
  async addMemory(memory: Memory): Promise<void> {
    if (this.data.memories.has(memory.name)) {
      throw new Error(`Memory '${memory.name}' already exists`);
    }
    this.data.memories.set(memory.name, memory);
    this.data.updatedAt = new Date().toISOString();
    await this.save();
  }

  /**
   * 删除Memory
   */
  async deleteMemory(name: string): Promise<boolean> {
    const deleted = this.data.memories.delete(name);
    if (deleted) {
      this.data.updatedAt = new Date().toISOString();
      await this.save();
    }
    return deleted;
  }

  /**
   * 获取Memory
   */
  getMemory(name: string): Memory | undefined {
    return this.data.memories.get(name);
  }

  /**
   * 检查Memory是否存在
   */
  hasMemory(name: string): boolean {
    return this.data.memories.has(name);
  }

  /**
   * 更新Memory
   */
  async updateMemory(memory: Memory): Promise<void> {
    if (this.data.memories.has(memory.name)) {
      this.data.memories.set(memory.name, memory);
      this.data.updatedAt = new Date().toISOString();
      await this.save();
    } else {
      throw new Error(`Memory '${memory.name}' not found`);
    }
  }

  /**
   * 列出所有Memory
   */
  listMemories(): Memory[] {
    return Array.from(this.data.memories.values());
  }

  /**
   * 根据类型筛选Memory
   */
  listMemoriesByType(type: 'raw' | 'list' | 'graph'): Memory[] {
    return this.listMemories().filter(memory => memory.type === type);
  }

  /**
   * 搜索Memory
   */
  searchMemories(options: {
    name?: string;
    type?: 'raw' | 'list' | 'graph';
    description?: string;
    nSimilars?: number;
  }): Memory[] {
    let results = this.listMemories();

    // 精确匹配筛选
    if (options.name) {
      results = results.filter(memory =>
        memory.name.toLowerCase().includes(options.name!.toLowerCase())
      );
    }

    if (options.type) {
      results = results.filter(memory => memory.type === options.type);
    }

    if (options.description) {
      results = results.filter(memory =>
        memory.description.toLowerCase().includes(options.description!.toLowerCase())
      );
    }

    return results;
  }

  /**
   * 获取数据库统计信息
   */
  getStats(): {
    totalMemories: number;
    rawMemories: number;
    listMemories: number;
    graphMemories: number;
    version: string;
    createdAt: string;
    updatedAt: string;
  } {
    const memories = this.listMemories();

    return {
      totalMemories: memories.length,
      rawMemories: memories.filter(m => m.type === 'raw').length,
      listMemories: memories.filter(m => m.type === 'list').length,
      graphMemories: memories.filter(m => m.type === 'graph').length,
      version: this.data.version,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt
    };
  }

  /**
   * 备份数据库
   */
  async backup(backupPath?: string): Promise<string> {
    const finalBackupPath = backupPath || `${this.dbPath}.backup.${Date.now()}`;

    try {
      fs.copyFileSync(this.dbPath, finalBackupPath);
      return finalBackupPath;
    } catch (error) {
      throw new Error(`Database backup failed: ${error}`);
    }
  }

  /**
   * 从备份恢复
   */
  async restore(backupPath: string): Promise<void> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }

      // 创建当前数据库的备份
      await this.backup();

      // 恢复数据
      fs.copyFileSync(backupPath, this.dbPath);

      // 重新加载数据
      await this.load();
    } catch (error) {
      throw new Error(`Database restore failed: ${error}`);
    }
  }

  /**
   * 添加Secret
   */
  async addSecret(secretId: string, secret: string, expiresAt: string): Promise<void> {
    if (this.data.secrets.has(secretId)) {
      throw new Error(`Secret '${secretId}' already exists`);
    }
    this.data.secrets.set(secretId, {
      secret,
      createdAt: new Date().toISOString(),
      expiresAt
    });
    this.data.updatedAt = new Date().toISOString();
    await this.save();
  }

  /**
   * 删除Secret
   */
  async deleteSecret(secretId: string): Promise<boolean> {
    const deleted = this.data.secrets.delete(secretId);
    if (deleted) {
      this.data.updatedAt = new Date().toISOString();
      await this.save();
    }
    return deleted;
  }

  /**
   * 获取Secret
   */
  getSecret(secretId: string): { secret: string; createdAt: string; expiresAt: string } | undefined {
    return this.data.secrets.get(secretId);
  }

  /**
   * 检查Secret是否存在
   */
  hasSecret(secretId: string): boolean {
    return this.data.secrets.has(secretId);
  }

  /**
   * 验证Secret是否有效
   */
  validateSecret(secretId: string, secret: string): boolean {
    const storedSecret = this.getSecret(secretId);
    if (!storedSecret) {
      return false;
    }

    // 检查是否过期
    const now = new Date();
    const expiresAt = new Date(storedSecret.expiresAt);
    if (now > expiresAt) {
      this.deleteSecret(secretId); // 删除过期的secret
      return false;
    }

    // 检查secret是否匹配
    return storedSecret.secret === secret;
  }

  /**
   * 清理所有过期的Secrets
   */
  async cleanupExpiredSecrets(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [secretId, secretData] of this.data.secrets.entries()) {
      const expiresAt = new Date(secretData.expiresAt);
      if (now > expiresAt) {
        this.data.secrets.delete(secretId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.data.updatedAt = new Date().toISOString();
      await this.save();
    }

    return cleanedCount;
  }

  /**
   * 获取所有Secrets（用于调试和管理）
   */
  listSecrets(): Array<{ id: string; secret: string; createdAt: string; expiresAt: string }> {
    const secrets: Array<{ id: string; secret: string; createdAt: string; expiresAt: string }> = [];
    this.data.secrets.forEach((value, key) => {
      secrets.push({
        id: key,
        secret: value.secret,
        createdAt: value.createdAt,
        expiresAt: value.expiresAt
      });
    });
    return secrets;
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    // JSON存储不需要关闭连接，但确保保存最新数据
    await this.save();
  }
}
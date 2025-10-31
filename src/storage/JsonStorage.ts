import * as fs from 'fs';
import * as path from 'path';
import { Memory, RawMemory, ListMemory } from '../types';
import { RawMemory as RawMemoryClass } from '../memory/RawMemory';

export interface DatabaseSchema {
  memories: Map<string, Memory>;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export class JsonStorage {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.data = {
      memories: new Map(),
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.load();
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

        this.data = {
          memories,
          version: jsonData.version || '1.0.0',
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
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  forceSave() {
    this.save();
  }

  /**
   * 保存数据库
   */
  private async save(): Promise<void> {
    try {
      // 确保目录存在
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 转换Map为普通对象以便序列化
      const memoriesObj: Record<string, Memory> = {};
      this.data.memories.forEach((value, key) => {
        memoriesObj[key] = value;
      });

      const jsonData = {
        memories: memoriesObj,
        version: this.data.version,
        createdAt: this.data.createdAt,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(this.dbPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (error) {
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
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    // JSON存储不需要关闭连接，但确保保存最新数据
    await this.save();
  }
}
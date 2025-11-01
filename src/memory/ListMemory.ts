import { ListMemory as IListMemory, RawMemory as IRawMemory } from '../types';
import { RawMemory } from './RawMemory';

export class ListMemory implements IListMemory {
  public name: string;
  public type: "list" = "list";
  public description: string;
  public list: RawMemory[];
  public role: "array" | "deque" | "stack";
  private nameMap: Map<string, RawMemory>;

  constructor(name: string, description: string, role: "array" | "deque" | "stack" = "array") {
    this.name = name;
    this.description = description;
    this.list = [];
    this.role = role;
    this.nameMap = new Map();
  }

  /**
   * 检查name是否已存在
   */
  private isNameExists(name: string): boolean {
    return this.nameMap.has(name);
  }

  /**
   * 添加RawMemory到nameMap
   */
  private addToNameMap(memory: RawMemory): void {
    if (this.isNameExists(memory.name)) {
      throw new Error(`RawMemory with name '${memory.name}' already exists in ListMemory '${this.name}'`);
    }
    this.nameMap.set(memory.name, memory);
  }

  /**
   * 从nameMap移除RawMemory
   */
  private removeFromNameMap(name: string): void {
    this.nameMap.delete(name);
  }

  /**
   * 添加元素到列表末尾
   */
  append(name: string, data: string, description?: string): void {
    const mem = new RawMemory(name, description || `Element ${this.list.length}`, data);
    this.addToNameMap(mem);
    this.list.push(mem);
  }

  /**
   * 在指定位置插入元素
   */
  insertAt(index: number, name: string, data: string, description?: string): void {
    if (index < 0 || index > this.list.length) {
      throw new Error(`Index ${index} out of bounds for list of length ${this.list.length}`);
    }

    const mem = new RawMemory(name, description || `Element ${index}`, data);
    this.addToNameMap(mem);
    this.list.splice(index, 0, mem);
  }

  /**
   * 移除指定位置的元素
   */
  removeAt(index: number): RawMemory {
    if (index < 0 || index >= this.list.length) {
      throw new Error(`Index ${index} out of bounds for list of length ${this.list.length}`);
    }

    const removed = this.list.splice(index, 1)[0];
    this.removeFromNameMap(removed.name);
    return removed;
  }

  /**
   * 清空列表
   */
  clear(): void {
    this.list = [];
    this.nameMap.clear();
  }

  /**
   * 检查列表是否为空
   */
  isEmpty(): boolean {
    return this.list.length === 0;
  }

  /**
   * 获取列表长度
   */
  get length(): number {
    return this.list.length;
  }

  /**
   * 获取指定位置的元素
   */
  getAt(index: number): RawMemory | undefined {
    if (index < 0 || index >= this.list.length) {
      return undefined;
    }
    return this.list[index];
  }

  /**
   * 设置指定位置的元素
   */
  setAt(index: number, memory: RawMemory): void {
    if (index < 0 || index >= this.list.length) {
      throw new Error(`Index ${index} out of bounds for list of length ${this.list.length}`);
    }

    // Check name uniqueness
    if (memory.name !== this.list[index].name && this.isNameExists(memory.name)) {
      throw new Error(`RawMemory with name '${memory.name}' already exists in ListMemory '${this.name}'`);
    }

    // Remove old name from map and add new name
    this.removeFromNameMap(this.list[index].name);
    this.addToNameMap(memory);

    this.list[index] = memory;
  }

  /**
   * 根据名称获取RawMemory
   */
  getByName(name: string): RawMemory | undefined {
    return this.nameMap.get(name);
  }

  /**
   * 搜索列表中的元素（支持正则表达式）
   */
  search(pattern?: string): Array<{
    index: number;
    data: RawMemory;
  }> {
    if (!pattern) {
      // 如果没有模式，返回所有元素
      return this.list.map((data, index) => ({
        index,
        data
      }));
    }
    const re = new RegExp(pattern, 'i');
    const results: Array<{
      index: number;
      data: RawMemory;
    }> = [];
    for (let i = 0; i < this.list.length; i++) {
      if (re.test(this.list[i].name + "\n" + this.list[i].description)) {
        results.push({
          index: i,
          data: this.list[i]
        });
      }
    }
    return results;
  }

  // ==================== Deque操作 ====================

  /**
   * 在队列前端添加元素
   */
  pushFront(name: string, data: string, description?: string): void {
    if (this.role !== 'deque') {
      throw new Error(`pushFront operation requires role 'deque', current role is '${this.role}'`);
    }

    const mem = new RawMemory(name, description || `Front element`, data);
    this.addToNameMap(mem);
    this.list.unshift(mem);
  }

  /**
   * 在队列后端添加元素
   */
  pushBack(name: string, data: string, description?: string): void {
    if (this.role !== 'deque') {
      throw new Error(`pushBack operation requires role 'deque', current role is '${this.role}'`);
    }

    this.append(name, data, description);
  }

  /**
   * 从队列前端移除元素
   */
  popFront(): RawMemory {
    if (this.role !== 'deque') {
      throw new Error(`popFront operation requires role 'deque', current role is '${this.role}'`);
    }

    if (this.isEmpty()) {
      throw new Error('Cannot pop from empty deque');
    }

    const removed = this.list.shift()!;
    this.removeFromNameMap(removed.name);
    return removed;
  }

  /**
   * 从队列后端移除元素
   */
  popBack(): RawMemory {
    if (this.role !== 'deque') {
      throw new Error(`popBack operation requires role 'deque', current role is '${this.role}'`);
    }

    if (this.isEmpty()) {
      throw new Error('Cannot pop from empty deque');
    }

    const removed = this.list.pop()!;
    this.removeFromNameMap(removed.name);
    return removed;
  }

  /**
   * 查询队列前端元素但不移除
   */
  peekFront(): RawMemory | undefined {
    if (this.role !== 'deque') {
      throw new Error(`peekFront operation requires role 'deque', current role is '${this.role}'`);
    }

    return this.list[0];
  }

  /**
   * 查询队列后端元素但不移除
   */
  peekBack(): RawMemory | undefined {
    if (this.role !== 'deque') {
      throw new Error(`peekBack operation requires role 'deque', current role is '${this.role}'`);
    }

    return this.list[this.list.length - 1];
  }

  // ==================== Stack操作 ====================

  /**
   * 压入元素到栈顶
   */
  pushTop(name: string, data: string, description?: string): void {
    if (this.role !== 'stack') {
      throw new Error(`pushTop operation requires role 'stack', current role is '${this.role}'`);
    }

    const mem = new RawMemory(name, description || `Top element`, data);
    this.addToNameMap(mem);
    this.list.push(mem);
  }

  /**
   * 从栈顶弹出元素
   */
  popTop(): RawMemory {
    if (this.role !== 'stack') {
      throw new Error(`popTop operation requires role 'stack', current role is '${this.role}'`);
    }

    if (this.isEmpty()) {
      throw new Error('Cannot pop from empty stack');
    }

    const removed = this.list.pop()!;
    this.removeFromNameMap(removed.name);
    return removed;
  }

  /**
   * 查询栈顶元素但不移除
   */
  peekTop(): RawMemory | undefined {
    if (this.role !== 'stack') {
      throw new Error(`peekTop operation requires role 'stack', current role is '${this.role}'`);
    }

    return this.list[this.list.length - 1];
  }

  // ==================== RawMemory操作代理 ====================

  /**
   * 转换为JSON对象
   */
  toJSON(): IListMemory {
    return {
      name: this.name,
      type: this.type,
      description: this.description,
      list: this.list,
      role: this.role
    };
  }

  /**
   * 从JSON对象创建实例
   */
  static fromJSON(data: IListMemory): ListMemory {
    const listMemory = new ListMemory(data.name, data.description, data.role);
    listMemory.list = (data.list || []).map((item: any) => RawMemory.fromJSON(item));

    // 重建nameMap
    listMemory.list.forEach(memory => {
      listMemory.nameMap.set(memory.name, memory);
    });

    return listMemory;
  }
}
/**
 * 插入ListMemory元素处理器
 * 处理 insertListElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  InsertListElementRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';

/**
 * 处理插入ListMemory元素请求
 */
export async function insertListElementHandler(
  storage: JsonStorage,
  request: InsertListElementRequest
): Promise<MCPResponse> {
  const { name, index, data, description } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 验证输入
  if (typeof index !== 'number' || index < 0) {
    throw new ValidationError('index', 'index must be a non-negative number');
  }
  if (typeof data !== 'string') {
    throw new ValidationError('data', 'data must be a string');
  }
  if (typeof description !== 'string') {
    throw new ValidationError('description', 'description must be a string');
  }

  // 检查索引范围（允许插入到末尾）
  if (index > listMemory.length) {
    throw new ValidationError('index', `index (${index}) cannot exceed list length (${listMemory.length})`);
  }

  // 生成元素名称
  const elementName = `element_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // 执行插入操作
  listMemory.insertAt(index, elementName, data, description);

  // 更新存储
  await storage.updateMemory(listMemory);

  return {
    success: true,
    data: {
      message: `Element inserted successfully at index ${index} in '${name}'`,
      elementName,
      index,
      listLength: listMemory.length,
      role: listMemory.role
    }
  };
}
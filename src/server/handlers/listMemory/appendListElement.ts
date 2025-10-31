/**
 * 添加ListMemory元素处理器
 * 处理 appendListElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  AppendListElementRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';

/**
 * 处理添加ListMemory元素请求
 */
export async function appendListElementHandler(
  storage: JsonStorage,
  request: AppendListElementRequest
): Promise<MCPResponse> {
  const { name, data, description } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 验证输入
  if (typeof data !== 'string') {
    throw new ValidationError('data', 'data must be a string');
  }
  if (typeof description !== 'string') {
    throw new ValidationError('description', 'description must be a string');
  }

  // 生成元素名称（基于时间戳）
  const elementName = `element_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // 执行添加操作
  listMemory.append(elementName, data, description);

  // 更新存储
  await storage.updateMemory(listMemory);

  return {
    success: true,
    data: {
      message: `Element appended successfully to '${name}'`,
      elementName,
      listLength: listMemory.length,
      role: listMemory.role
    }
  };
}
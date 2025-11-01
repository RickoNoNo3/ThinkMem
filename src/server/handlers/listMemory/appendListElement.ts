/**
 * 添加ListMemory元素处理器
 * 处理 appendListElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  AppendListElementRequest,
  AppendListElementResponse,
  MCPResponse,
  ListMemoryMetadata
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
  const { name, child_name, data, description } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 验证输入
  if (typeof child_name !== 'string') {
    throw new ValidationError('child_name', 'child_name must be a string');
  }
  if (typeof data !== 'string') {
    throw new ValidationError('data', 'data must be a string');
  }
  if (typeof description !== 'string') {
    throw new ValidationError('description', 'description must be a string');
  }

  // 执行添加操作
  listMemory.append(child_name, data, description);

  // 更新存储
  await storage.updateMemory(listMemory);

  // 添加ListMemory元数据，与searchMemory保持一致
  const metadata: ListMemoryMetadata = {
    length: listMemory.length,
    role: listMemory.role
  };

  const responseData: AppendListElementResponse = {
    message: `Element '${child_name}' appended successfully to '${name}'`,
    elementName: child_name,
    metadata
  };
  return {
    success: true,
    data: responseData
  };
}
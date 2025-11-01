/**
 * 双端队列元素入队处理器
 * 处理 pushDequeElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  PushDequeElementRequest,
  PushDequeElementResponse,
  MCPResponse,
  ListMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError,
  InvalidOperationError
} from '../../../utils/errors';

/**
 * 处理双端队列元素入队请求
 */
export async function pushDequeElementHandler(
  storage: JsonStorage,
  request: PushDequeElementRequest
): Promise<MCPResponse> {
  const { name, child_name, data, description, position } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 验证是否为双端队列角色
  if (listMemory.role !== 'deque') {
    throw new InvalidOperationError('pushDequeElement', `Memory '${name}' is not a deque (current role: ${listMemory.role})`);
  }

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
  if (position !== 'front' && position !== 'back') {
    throw new ValidationError('position', 'position must be either "front" or "back"');
  }

  // 执行入队操作
  if (position === 'front') {
    listMemory.pushFront(child_name, data, description);
  } else {
    listMemory.pushBack(child_name, data, description);
  }

  // 更新存储
  await storage.updateMemory(listMemory);

  // 添加ListMemory元数据，与searchMemory保持一致
  const metadata: ListMemoryMetadata = {
    length: listMemory.length,
    role: listMemory.role
  };

  const responseData: PushDequeElementResponse = {
    message: `Element '${child_name}' pushed to ${position} of deque '${name}' successfully`,
    elementName: child_name,
    position,
    metadata
  };
  return {
    success: true,
    data: responseData
  };
}
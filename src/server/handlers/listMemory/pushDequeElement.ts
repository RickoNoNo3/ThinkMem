/**
 * 双端队列元素入队处理器
 * 处理 pushDequeElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  PushDequeElementRequest,
  MCPResponse
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
  const { name, data, description, position } = request;

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
  if (typeof data !== 'string') {
    throw new ValidationError('data', 'data must be a string');
  }
  if (typeof description !== 'string') {
    throw new ValidationError('description', 'description must be a string');
  }
  if (position !== 'front' && position !== 'back') {
    throw new ValidationError('position', 'position must be either "front" or "back"');
  }

  // 生成元素名称
  const elementName = `deque_element_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // 执行入队操作
  if (position === 'front') {
    listMemory.pushFront(elementName, data, description);
  } else {
    listMemory.pushBack(elementName, data, description);
  }

  // 更新存储
  await storage.updateMemory(listMemory);

  return {
    success: true,
    data: {
      message: `Element pushed to ${position} of deque '${name}' successfully`,
      elementName,
      position,
      listLength: listMemory.length,
      role: listMemory.role
    }
  };
}
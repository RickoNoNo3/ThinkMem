/**
 * 栈元素入栈处理器
 * 处理 pushStackElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  PushStackElementRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError,
  InvalidOperationError
} from '../../../utils/errors';

/**
 * 处理栈元素入栈请求
 */
export async function pushStackElementHandler(
  storage: JsonStorage,
  request: PushStackElementRequest
): Promise<MCPResponse> {
  const { name, data, description } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 验证是否为栈角色
  if (listMemory.role !== 'stack') {
    throw new InvalidOperationError('pushStackElement', `Memory '${name}' is not a stack (current role: ${listMemory.role})`);
  }

  // 验证输入
  if (typeof data !== 'string') {
    throw new ValidationError('data', 'data must be a string');
  }
  if (typeof description !== 'string') {
    throw new ValidationError('description', 'description must be a string');
  }

  // 生成元素名称
  const elementName = `stack_element_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // 执行入栈操作
  listMemory.pushTop(elementName, data, description);

  // 更新存储
  await storage.updateMemory(listMemory);

  return {
    success: true,
    data: {
      message: `Element pushed to top of stack '${name}' successfully`,
      elementName,
      listLength: listMemory.length,
      role: listMemory.role
    }
  };
}
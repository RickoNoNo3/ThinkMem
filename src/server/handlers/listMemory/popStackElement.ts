/**
 * 栈元素出栈处理器
 * 处理 popStackElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import { RawMemory } from '../../../memory/RawMemory';
import {
  PopStackElementRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError,
  InvalidOperationError
} from '../../../utils/errors';

/**
 * 处理栈元素出栈请求
 */
export async function popStackElementHandler(
  storage: JsonStorage,
  request: PopStackElementRequest
): Promise<MCPResponse> {
  const { name } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 验证是否为栈角色
  if (listMemory.role !== 'stack') {
    throw new InvalidOperationError('popStackElement', `Memory '${name}' is not a stack (current role: ${listMemory.role})`);
  }

  // 检查栈是否为空
  if (listMemory.length === 0) {
    throw new InvalidOperationError('popStackElement', `Stack '${name}' is empty`);
  }

  // 执行出栈操作
  const poppedElement = listMemory.popTop();

  // 更新存储
  await storage.updateMemory(listMemory);

  return {
    success: true,
    data: {
      message: `Element popped from top of stack '${name}' successfully`,
      poppedElement: poppedElement.toSmartJSON(),
      listLength: listMemory.length,
      role: listMemory.role
    }
  };
}
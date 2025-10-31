/**
 * 查看栈元素处理器
 * 处理 peekStackElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import { RawMemory } from '../../../memory/RawMemory';
import {
  PeekStackElementRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError,
  InvalidOperationError
} from '../../../utils/errors';

/**
 * 处理查看栈元素请求
 */
export async function peekStackElementHandler(
  storage: JsonStorage,
  request: PeekStackElementRequest
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
    throw new InvalidOperationError('peekStackElement', `Memory '${name}' is not a stack (current role: ${listMemory.role})`);
  }

  // 检查栈是否为空
  if (listMemory.length === 0) {
    return {
      success: true,
      data: {
        message: `Stack '${name}' is empty, no element to peek`,
        element: null,
        listLength: 0,
        role: listMemory.role
      }
    };
  }

  // 执行查看操作
  const element = listMemory.peekTop();

  return {
    success: true,
    data: {
      message: `Element peeked from top of stack '${name}' successfully`,
      element: element ? element.toSmartJSON() : null,
      listLength: listMemory.length,
      role: listMemory.role
    }
  };
}
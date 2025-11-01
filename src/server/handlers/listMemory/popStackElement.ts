/**
 * 栈元素出栈处理器
 * 处理 popStackElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import { RawMemory } from '../../../memory/RawMemory';
import {
  PopStackElementRequest,
  PopStackElementResponse,
  MCPResponse,
  ListMemoryMetadata,
  RawMemoryMetadata
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

  // 添加ListMemory和RawMemory元数据，与searchMemory保持一致
  const listMetadata: ListMemoryMetadata = {
    length: listMemory.length,
    role: listMemory.role
  };

  const rawMetadata: RawMemoryMetadata = {
    nLines: poppedElement.nLines,
    nChars: poppedElement.nChars
  };

  const responseData: PopStackElementResponse = {
    message: `Element popped from top of stack '${name}' successfully`,
    poppedElement: poppedElement.toSmartJSON(),
    poppedElementMetadata: rawMetadata,
    metadata: listMetadata
  };
  return {
    success: true,
    data: responseData
  };
}
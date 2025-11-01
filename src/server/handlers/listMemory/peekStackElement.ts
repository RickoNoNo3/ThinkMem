/**
 * 查看栈元素处理器
 * 处理 peekStackElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import { RawMemory } from '../../../memory/RawMemory';
import {
  PeekStackElementRequest,
  PeekStackElementResponse,
  MCPResponse,
  RawMemoryMetadata,
  ListMemoryMetadata
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
    // 构建ListMemory元数据
    const metadata: ListMemoryMetadata = {
      length: listMemory.length,
      role: listMemory.role
    };

    // 构建完整的PeekStackElementResponse
    const responseData: PeekStackElementResponse = {
      message: `Stack '${name}' is empty, no element to peek`,
      element: null,
      metadata
    };

    return {
      success: true,
      data: responseData
    };
  }

  // 执行查看操作
  const element = listMemory.peekTop();

  // 添加RawMemory元数据，与searchMemory保持一致
  let elementMetadata: RawMemoryMetadata | undefined;
  if (element) {
    elementMetadata = {
      nLines: element.nLines,
      nChars: element.nChars
    };
  }

  // 添加ListMemory元数据
  const metadata: ListMemoryMetadata = {
    length: listMemory.length,
    role: listMemory.role
  };

  // 构建完整的PeekStackElementResponse
  const responseData: PeekStackElementResponse = {
    message: `Element peeked from top of stack '${name}' successfully`,
    element: element ? element.toSmartJSON() : null,
    elementMetadata,
    metadata
  };

  return {
    success: true,
    data: responseData
  };
}
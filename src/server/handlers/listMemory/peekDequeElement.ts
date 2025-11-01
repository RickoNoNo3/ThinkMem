/**
 * 查看双端队列元素处理器
 * 处理 peekDequeElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import { RawMemory } from '../../../memory/RawMemory';
import {
  PeekDequeElementRequest,
  PeekDequeElementResponse,
  MCPResponse,
  RawMemoryMetadata,
  ListMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError,
  InvalidOperationError
} from '../../../utils/errors';

/**
 * 处理查看双端队列元素请求
 */
export async function peekDequeElementHandler(
  storage: JsonStorage,
  request: PeekDequeElementRequest
): Promise<MCPResponse> {
  const { name, position } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 验证是否为双端队列角色
  if (listMemory.role !== 'deque') {
    throw new InvalidOperationError('peekDequeElement', `Memory '${name}' is not a deque (current role: ${listMemory.role})`);
  }

  // 验证输入
  if (position !== 'front' && position !== 'back') {
    throw new ValidationError('position', 'position must be either "front" or "back"');
  }

  // 检查队列是否为空
  if (listMemory.length === 0) {
    // 构建ListMemory元数据
    const metadata: ListMemoryMetadata = {
      length: listMemory.length,
      role: listMemory.role
    };

    // 构建完整的PeekDequeElementResponse
    const responseData: PeekDequeElementResponse = {
      message: `Deque '${name}' is empty, no element to peek`,
      position,
      element: null,
      metadata
    };

    return {
      success: true,
      data: responseData
    };
  }

  // 执行查看操作
  let element: any;
  if (position === 'front') {
    element = listMemory.peekFront();
  } else {
    element = listMemory.peekBack();
  }

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

  // 构建完整的PeekDequeElementResponse
  const responseData: PeekDequeElementResponse = {
    message: `Element peeked from ${position} of deque '${name}' successfully`,
    position,
    element: element ? element.toSmartJSON() : null,
    elementMetadata,
    metadata
  };

  return {
    success: true,
    data: responseData
  };
}
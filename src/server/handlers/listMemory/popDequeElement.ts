/**
 * 双端队列元素出队处理器
 * 处理 popDequeElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import { RawMemory } from '../../../memory/RawMemory';
import {
  PopDequeElementRequest,
  PopDequeElementResponse,
  MCPResponse,
  ListMemoryMetadata,
  RawMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError,
  InvalidOperationError
} from '../../../utils/errors';

/**
 * 处理双端队列元素出队请求
 */
export async function popDequeElementHandler(
  storage: JsonStorage,
  request: PopDequeElementRequest
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
    throw new InvalidOperationError('popDequeElement', `Memory '${name}' is not a deque (current role: ${listMemory.role})`);
  }

  // 验证输入
  if (position !== 'front' && position !== 'back') {
    throw new ValidationError('position', 'position must be either "front" or "back"');
  }

  // 检查队列是否为空
  if (listMemory.length === 0) {
    throw new InvalidOperationError('popDequeElement', `Deque '${name}' is empty`);
  }

  // 执行出队操作
  let poppedElement: any;
  if (position === 'front') {
    poppedElement = listMemory.popFront();
  } else {
    poppedElement = listMemory.popBack();
  }

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

  const responseData: PopDequeElementResponse = {
    message: `Element popped from ${position} of deque '${name}' successfully`,
    position,
    poppedElement: poppedElement.toSmartJSON(),
    poppedElementMetadata: rawMetadata,
    metadata: listMetadata
  };
  return {
    success: true,
    data: responseData
  };
}
/**
 * 栈元素入栈处理器
 * 处理 pushStackElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  PushStackElementRequest,
  PushStackElementResponse,
  MCPResponse,
  ListMemoryMetadata
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
  const { name, child_name, data, description } = request;

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
  if (typeof child_name !== 'string') {
    throw new ValidationError('child_name', 'child_name must be a string');
  }
  if (typeof data !== 'string') {
    throw new ValidationError('data', 'data must be a string');
  }
  if (typeof description !== 'string') {
    throw new ValidationError('description', 'description must be a string');
  }

  // 执行入栈操作
  listMemory.pushTop(child_name, data, description);

  // 更新存储
  await storage.updateMemory(listMemory);

  // 添加ListMemory元数据，与searchMemory保持一致
  const metadata: ListMemoryMetadata = {
    length: listMemory.length,
    role: listMemory.role
  };

  const responseData: PushStackElementResponse = {
    message: `Element '${child_name}' pushed to top of stack '${name}' successfully`,
    elementName: child_name,
    metadata
  };
  return {
    success: true,
    data: responseData
  };
}
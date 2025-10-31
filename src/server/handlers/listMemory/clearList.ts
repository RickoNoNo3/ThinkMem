/**
 * 清空ListMemory处理器
 * 处理 clearList 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  ClearListRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError
} from '../../../utils/errors';

/**
 * 处理清空ListMemory请求
 */
export async function clearListHandler(
  storage: JsonStorage,
  request: ClearListRequest
): Promise<MCPResponse> {
  const { name } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 保存清空前的信息
  const beforeLength = listMemory.length;
  const role = listMemory.role;

  // 执行清空操作
  listMemory.clear();

  // 更新存储
  await storage.updateMemory(listMemory);

  return {
    success: true,
    data: {
      message: `List '${name}' cleared successfully`,
      beforeLength,
      afterLength: listMemory.length,
      role: role
    }
  };
}
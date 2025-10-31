/**
 * 删除Memory处理器
 * 处理 deleteMemory 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import {
  DeleteMemoryRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError
} from '../../../utils/errors';

/**
 * 处理删除Memory请求
 */
export async function deleteMemoryHandler(
  storage: JsonStorage,
  request: DeleteMemoryRequest
): Promise<MCPResponse> {
  const { name } = request;

  // 检查是否存在
  if (!storage.hasMemory(name)) {
    throw new MemoryNotFoundError(name);
  }

  // 获取删除前的Memory信息
  const memory = storage.getMemory(name);
  if (!memory) {
    throw new MemoryNotFoundError(name);
  }
  const memoryType = memory.type;

  // 执行删除
  const deleted = await storage.deleteMemory(name);

  return {
    success: deleted,
    data: {
      message: `Memory '${name}' deleted successfully`,
      type: memoryType,
      deleted: deleted
    }
  };
}
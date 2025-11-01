/**
 * 删除ListMemory元素处理器
 * 处理 deleteListElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  DeleteListElementRequest,
  DeleteListElementResponse,
  MCPResponse,
  ListMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';

/**
 * 处理删除ListMemory元素请求
 */
export async function deleteListElementHandler(
  storage: JsonStorage,
  request: DeleteListElementRequest
): Promise<MCPResponse> {
  const { name, index } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 验证输入
  if (typeof index !== 'number' || index < 0) {
    throw new ValidationError('index', 'index must be a non-negative number');
  }

  // 检查索引范围
  if (index >= listMemory.length) {
    throw new ValidationError('index', `index (${index}) exceeds list length (${listMemory.length})`);
  }

  // 获取删除前的信息
  const beforeLength = listMemory.length;
  const deletedElement = listMemory.getAt(index);

  // 执行删除操作
  listMemory.removeAt(index);

  // 更新存储
  await storage.updateMemory(listMemory);

  // 添加ListMemory元数据，与searchMemory保持一致
  const metadata: ListMemoryMetadata = {
    length: listMemory.length,
    role: listMemory.role
  };

  const responseData: DeleteListElementResponse = {
    message: `Element deleted successfully from index ${index} in '${name}'`,
    index,
    deletedElement: deletedElement ? deletedElement.toSmartJSON() : null,
    beforeLength,
    afterLength: listMemory.length,
    metadata
  };
  return {
    success: true,
    data: responseData
  };
}
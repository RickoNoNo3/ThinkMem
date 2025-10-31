/**
 * 获取ListMemory元素处理器
 * 处理 getListElement 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import { RawMemory } from '../../../memory/RawMemory';
import {
  GetListElementRequest,
  GetListElementResponse,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';

/**
 * 处理获取ListMemory元素请求
 */
export async function getListElementHandler(
  storage: JsonStorage,
  request: GetListElementRequest
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

  // 获取元素
  const element = listMemory.getAt(index);

  // 构建响应
  const response: GetListElementResponse = {
    data: element ? element.toSmartJSON() : undefined
  };

  return {
    success: true,
    data: {
      ...response,
      index,
      listLength: listMemory.length,
      role: listMemory.role
    }
  };
}
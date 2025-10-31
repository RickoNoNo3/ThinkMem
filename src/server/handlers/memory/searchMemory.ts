/**
 * 搜索Memory处理器
 * 处理 searchMemory 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import {
  SearchMemoryRequest,
  SearchMemoryResponse,
  Memory,
  MCPResponse
} from '../../../types';

/**
 * 处理搜索Memory请求
 */
export async function searchMemoryHandler(
  storage: JsonStorage,
  request: SearchMemoryRequest
): Promise<MCPResponse> {
  const { query } = request;

  // 获取所有Memory
  let results = storage.listMemories();

  // 应用筛选条件
  if (query) {
    // 按名称模式筛选
    if (query.pattern) {
      const pattern = query.pattern.toLowerCase();
      results = results.filter(memory =>
        memory.name.toLowerCase().includes(pattern) ||
        memory.description.toLowerCase().includes(pattern)
      );
    }

    // 按类型筛选
    if (query.type) {
      results = results.filter(memory => memory.type === query.type);
    }
  }

  // 构建响应
  const response: SearchMemoryResponse = {
    results: results.map(memory => ({
      name: memory.name,
      type: memory.type,
      description: memory.description
    } as Memory))
  };

  return {
    success: true,
    data: response
  };
}
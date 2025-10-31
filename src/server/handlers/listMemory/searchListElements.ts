/**
 * 搜索ListMemory元素处理器
 * 处理 searchListElements 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import { RawMemory } from '../../../memory/RawMemory';
import {
  SearchListElementsRequest,
  SearchListElementsResponse,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError
} from '../../../utils/errors';

/**
 * 处理搜索ListMemory元素请求
 */
export async function searchListElementsHandler(
  storage: JsonStorage,
  request: SearchListElementsRequest
): Promise<MCPResponse> {
  const { name, pattern } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 执行搜索操作
  const searchResults = listMemory.search(pattern);

  // 构建响应
  const response: SearchListElementsResponse = {
    results: searchResults.map(result => ({
      index: result.index,
      data: result.data.toSmartJSON()
    }))
  };

  return {
    success: true,
    data: {
      ...response,
      searchPattern: pattern || null,
      totalElements: listMemory.length,
      matchedElements: searchResults.length,
      role: listMemory.role
    }
  };
}
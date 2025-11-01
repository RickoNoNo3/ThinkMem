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
  MCPResponse,
  ListMemoryMetadata,
  RawMemoryMetadata
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

  // 构建结果，为每个RawMemory元素添加元数据
  const results = searchResults.map(result => {
    const rawMemory = result.data;
    return {
      index: result.index,
      data: rawMemory.toSmartJSON(),
      metadata: {
        nLines: rawMemory.nLines,
        nChars: rawMemory.nChars
      } as RawMemoryMetadata
    };
  });

  // 添加ListMemory元数据，与searchMemory保持一致
  const listMetadata: ListMemoryMetadata = {
    length: listMemory.length,
    role: listMemory.role
  };

  // 构建完整的SearchListElementsResponse
  const responseData: SearchListElementsResponse = {
    results,
    searchPattern: pattern || null,
    totalElements: listMemory.length,
    matchedElements: searchResults.length,
    metadata: listMetadata
  };

  return {
    success: true,
    data: responseData
  };
}
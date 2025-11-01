/**
 * 搜索Memory处理器
 * 处理 searchMemory 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import {
  SearchMemoryRequest,
  SearchMemoryResponse,
  ExtendedSearchResult,
  RawMemoryMetadata,
  ListMemoryMetadata,
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
    // 按类型筛选
    if (query.type) {
      results = results.filter(memory => memory.type === query.type);
    }

    // 按名称模式筛选（使用正则表达式）
    if (query.pattern) {
      const re = new RegExp(query.pattern, 'i');
      // results = results.filter(memory => re.test(memory.name + "\n" + memory.description));
      results = results.filter(memory => {
        return re.test(memory.name + "\n" + memory.description);
      });
    }
  }

  // 构建响应，包含类型特定的元数据
  const response: SearchMemoryResponse = {
    results: results.map(memory => {
      const result: ExtendedSearchResult = {
        name: memory.name,
        type: memory.type,
        description: memory.description
      };

      // 根据Memory类型添加特定的元数据
      if (memory.type === 'raw') {
        const rawMemory = memory as any; // 类型断言，因为我们从storage获取的是完整对象
        result.metadata = {
          nLines: rawMemory.nLines || 0,
          nChars: rawMemory.nChars || 0
        } as RawMemoryMetadata;
      } else if (memory.type === 'list') {
        const listMemory = memory as any; // 类型断言
        result.metadata = {
          length: listMemory.list?.length || 0,
          role: listMemory.role || 'array'
        } as ListMemoryMetadata;
      }

      return result;
    })
  };

  return {
    success: true,
    data: response
  };
}
/**
 * 搜索RawMemory行处理器
 * 处理 searchRawLines 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { RawMemory } from '../../../memory/RawMemory';
import {
  SearchRawLinesRequest,
  SearchRawLinesResponse,
  MCPResponse,
  RawMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';
import { NamePathHelper } from '../../../storage/NamePathHelper';

/**
 * 处理搜索RawMemory行请求
 */
export async function searchRawLinesHandler(
  storage: JsonStorage,
  request: SearchRawLinesRequest
): Promise<MCPResponse> {
  const { namePath, pattern } = request;

  // 解析namePath获取memory对象
  const [getRaw, setRaw] = NamePathHelper.GetAndUpdate(storage, namePath);
  const memory = getRaw();
  if (!memory || memory.type !== 'raw') {
    throw new MemoryNotFoundError(namePath);
  }

  const rawMemory = memory as RawMemory;

  // 验证输入
  if (typeof pattern !== 'string' || pattern.trim() === '') {
    throw new ValidationError('pattern', 'pattern must be a non-empty string');
  }

  // 执行搜索操作
  const searchResults = rawMemory.searchLines(pattern);

  // 构建lines数据
  const lines = searchResults.map(result => ({
    lineNo: result.lineNo,
    text: result.text
  }));

  // 添加RawMemory元数据，与searchMemory保持一致
  const metadata: RawMemoryMetadata = {
    nLines: rawMemory.nLines,
    nChars: rawMemory.nChars
  };

  // 构建完整的SearchRawLinesResponse
  const responseData: SearchRawLinesResponse = {
    lines,
    searchPattern: pattern,
    totalLines: rawMemory.nLines,
    matchedLines: searchResults.length,
    metadata
  };

  return {
    success: true,
    data: responseData
  };
}
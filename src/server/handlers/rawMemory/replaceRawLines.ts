/**
 * 替换RawMemory行处理器
 * 处理 replaceRawLines 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { RawMemory } from '../../../memory/RawMemory';
import {
  ReplaceRawLinesRequest,
  ReplaceRawLinesResponse,
  MCPResponse,
  RawMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';
import { NamePathHelper } from '../../../storage/NamePathHelper';

/**
 * 处理替换RawMemory行请求
 */
export async function replaceRawLinesHandler(
  storage: JsonStorage,
  request: ReplaceRawLinesRequest
): Promise<MCPResponse> {
  const { namePath, lineBeg, lineEnd, pattern, text } = request;

  // 解析namePath获取memory对象
  const [getRaw, setRaw] = NamePathHelper.GetAndUpdate(storage, namePath);
  const memory = getRaw();
  if (!memory || memory.type !== 'raw') {
    throw new MemoryNotFoundError(namePath);
  }

  const rawMemory = memory as RawMemory;

  // 验证输入
  if (typeof lineBeg !== 'number' || lineBeg < 0) {
    throw new ValidationError('lineBeg', 'lineBeg must be a non-negative number');
  }
  if (typeof lineEnd !== 'number' || lineEnd < lineBeg) {
    throw new ValidationError('lineEnd', 'lineEnd must be greater than or equal to lineBeg');
  }
  if (typeof pattern !== 'string' || pattern.trim() === '') {
    throw new ValidationError('pattern', 'pattern must be a non-empty string');
  }
  if (typeof text !== 'string') {
    throw new ValidationError('text', 'text must be a string');
  }

  // 检查行号范围是否有效
  if (lineBeg >= rawMemory.nLines) {
    throw new ValidationError('lineBeg', `lineBeg (${lineBeg}) exceeds memory line count (${rawMemory.nLines})`);
  }
  if (lineEnd >= rawMemory.nLines) {
    throw new ValidationError('lineEnd', `lineEnd (${lineEnd}) exceeds memory line count (${rawMemory.nLines})`);
  }

  // 执行替换操作
  rawMemory.replace(lineBeg, lineEnd, pattern, text);

  // 更新存储
  await setRaw(rawMemory);

  // 添加RawMemory元数据，与searchMemory保持一致
  const metadata: RawMemoryMetadata = {
    nLines: rawMemory.nLines,
    nChars: rawMemory.nChars
  };

  // 构建完整的ReplaceRawLinesResponse
  const responseData: ReplaceRawLinesResponse = {
    message: `Lines ${lineBeg}-${lineEnd} replaced successfully in '${namePath}'`,
    lineBeg,
    lineEnd,
    pattern,
    metadata
  };

  return {
    success: true,
    data: responseData
  };
}
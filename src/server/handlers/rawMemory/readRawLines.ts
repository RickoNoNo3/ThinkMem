/**
 * 读取RawMemory行处理器
 * 处理 readRawLines 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { RawMemory } from '../../../memory/RawMemory';
import {
  ReadRawLinesRequest,
  ReadRawLinesResponse,
  MCPResponse,
  RawMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';
import { NamePathHelper } from '../../../storage/NamePathHelper';

/**
 * 处理读取RawMemory行请求
 */
export async function readRawLinesHandler(
  storage: JsonStorage,
  request: ReadRawLinesRequest
): Promise<MCPResponse> {
  const { namePath, lineBeg, lineEnd, summarize = false } = request;

  // 解析namePath获取memory对象
  const [getRaw, setRaw] = NamePathHelper.GetAndUpdate(storage, namePath);
  const memory = getRaw();
  if (!memory || memory.type !== 'raw') {
    throw new MemoryNotFoundError(namePath);
  }

  const rawMemory = memory as RawMemory;

  // 验证输入
  if (lineBeg !== undefined && (typeof lineBeg !== 'number' || lineBeg < 0)) {
    throw new ValidationError('lineBeg', 'lineBeg must be a non-negative number');
  }
  if (lineEnd !== undefined && (typeof lineEnd !== 'number' || lineEnd < 0)) {
    throw new ValidationError('lineEnd', 'lineEnd must be a non-negative number');
  }
  if (lineBeg !== undefined && lineEnd !== undefined && lineEnd < lineBeg) {
    throw new ValidationError('lineEnd', 'lineEnd must be greater than or equal to lineBeg');
  }

  // 检查行号范围是否有效
  const actualLineBeg = lineBeg ?? 0;
  const actualLineEnd = lineEnd ?? rawMemory.nLines - 1;

  if (actualLineBeg >= rawMemory.nLines) {
    throw new ValidationError('lineBeg', `lineBeg (${actualLineBeg}) exceeds memory line count (${rawMemory.nLines})`);
  }
  if (actualLineEnd >= rawMemory.nLines) {
    throw new ValidationError('lineEnd', `lineEnd (${actualLineEnd}) exceeds memory line count (${rawMemory.nLines})`);
  }

  // 执行读取操作
  let response: ReadRawLinesResponse;

  if (summarize) {
    // 智能摘要模式
    const readResult = rawMemory.read(actualLineBeg, actualLineEnd);
    response = {
      data: readResult.data,
      summaries: readResult.summaries,
      happyToSum: readResult.happyToSum
    };
  } else {
    // 原始数据模式
    const data = rawMemory.readData(actualLineBeg, actualLineEnd);
    response = {
      data: data,
      happyToSum: 'NONEED'
    };
  }

  // 添加RawMemory元数据，与searchMemory保持一致
  const metadata: RawMemoryMetadata = {
    nLines: rawMemory.nLines,
    nChars: rawMemory.nChars
  };

  return {
    success: true,
    data: {
      ...response,
      metadata
    }
  };
}
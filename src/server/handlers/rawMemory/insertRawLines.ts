/**
 * 插入RawMemory行处理器
 * 处理 insertRawLines 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { RawMemory } from '../../../memory/RawMemory';
import {
  InsertRawLinesRequest,
  InsertRawLinesResponse,
  MCPResponse,
  RawMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';
import { NamePathHelper } from '../../../storage/NamePathHelper';

/**
 * 处理插入RawMemory行请求
 */
export async function insertRawLinesHandler(
  storage: JsonStorage,
  request: InsertRawLinesRequest
): Promise<MCPResponse> {
  const { namePath, lineNo, text } = request;

  // 解析namePath获取memory对象
  const [getRaw, setRaw] = NamePathHelper.GetAndUpdate(storage, namePath);
  const memory = getRaw();
  if (!memory || memory.type !== 'raw') {
    throw new MemoryNotFoundError(namePath);
  }

  const rawMemory = memory as RawMemory;

  // 验证输入
  if (typeof lineNo !== 'number' || lineNo < 0) {
    throw new ValidationError('lineNo', 'lineNo must be a non-negative number');
  }
  if (typeof text !== 'string') {
    throw new ValidationError('text', 'text must be a string');
  }

  // 检查行号范围是否有效（允许插入到末尾）
  if (lineNo > rawMemory.nLines) {
    throw new ValidationError('lineNo', `lineNo (${lineNo}) cannot exceed memory line count (${rawMemory.nLines}) + 1`);
  }

  // 保存插入前的信息
  const beforeLines = rawMemory.nLines;
  const insertedLineCount = text.split('\n').length;

  // 执行插入操作
  rawMemory.insert(lineNo, text);

  // 更新存储
  await setRaw(rawMemory);

  // 添加RawMemory元数据，与searchMemory保持一致
  const metadata: RawMemoryMetadata = {
    nLines: rawMemory.nLines,
    nChars: rawMemory.nChars
  };

  // 构建符合InsertRawLinesResponse接口的响应数据
  const responseData: InsertRawLinesResponse = {
    message: `Text inserted successfully at line ${lineNo} in '${namePath}'`,
    lineNo,
    insertedLineCount,
    beforeLines,
    afterLines: rawMemory.nLines,
    metadata
  };

  return {
    success: true,
    data: responseData
  };
}
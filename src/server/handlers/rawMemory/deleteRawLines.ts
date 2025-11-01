/**
 * 删除RawMemory行处理器
 * 处理 deleteRawLines 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { RawMemory } from '../../../memory/RawMemory';
import {
  DeleteRawLinesRequest,
  DeleteRawLinesResponse,
  MCPResponse,
  RawMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';
import { NamePathHelper } from '../../../storage/NamePathHelper';

/**
 * 处理删除RawMemory行请求
 */
export async function deleteRawLinesHandler(
  storage: JsonStorage,
  request: DeleteRawLinesRequest
): Promise<MCPResponse> {
  const { namePath, lineBeg, lineEnd } = request;

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

  // 检查行号范围是否有效
  if (lineBeg >= rawMemory.nLines) {
    throw new ValidationError('lineBeg', `lineBeg (${lineBeg}) exceeds memory line count (${rawMemory.nLines})`);
  }
  if (lineEnd >= rawMemory.nLines) {
    throw new ValidationError('lineEnd', `lineEnd (${lineEnd}) exceeds memory line count (${rawMemory.nLines})`);
  }

  // 保存删除前的信息
  const beforeLines = rawMemory.nLines;
  const deletedLineCount = lineEnd - lineBeg + 1;

  // 执行删除操作
  rawMemory.delete(lineBeg, lineEnd);

  // 更新存储
  await setRaw(rawMemory);

  // 添加RawMemory元数据，与searchMemory保持一致
  const metadata: RawMemoryMetadata = {
    nLines: rawMemory.nLines,
    nChars: rawMemory.nChars
  };

  // 构建符合DeleteRawLinesResponse接口的响应数据
  const responseData: DeleteRawLinesResponse = {
    message: `Lines ${lineBeg}-${lineEnd} deleted successfully from '${namePath}'`,
    lineBeg,
    lineEnd,
    deletedLineCount,
    beforeLines,
    afterLines: rawMemory.nLines,
    metadata
  };

  return {
    success: true,
    data: responseData
  };
}
/**
 * 添加RawMemory摘要处理器
 * 处理 summarizeRawLines 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { RawMemory } from '../../../memory/RawMemory';
import {
  SummarizeRawLinesRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';
import { NamePathHelper } from '../../../storage/NamePathHelper';

/**
 * 处理添加RawMemory摘要请求
 */
export async function summarizeRawLinesHandler(
  storage: JsonStorage,
  request: SummarizeRawLinesRequest
): Promise<MCPResponse> {
  const { namePath, lineBeg, lineEnd, text } = request;

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
  if (typeof text !== 'string' || text.trim() === '') {
    throw new ValidationError('text', 'text must be a non-empty string');
  }

  // 检查行号范围是否有效
  if (lineBeg >= rawMemory.nLines) {
    throw new ValidationError('lineBeg', `lineBeg (${lineBeg}) exceeds memory line count (${rawMemory.nLines})`);
  }
  if (lineEnd >= rawMemory.nLines) {
    throw new ValidationError('lineEnd', `lineEnd (${lineEnd}) exceeds memory line count (${rawMemory.nLines})`);
  }

  // 执行添加摘要操作
  rawMemory.addSummary(lineBeg, lineEnd, text);

  // 更新存储
  await setRaw(rawMemory);

  return {
    success: true,
    data: {
      message: `Summary added successfully for lines ${lineBeg}-${lineEnd} in '${namePath}'`,
      lineBeg,
      lineEnd,
      summaryText: text,
      totalSummaries: rawMemory.summaries.length
    }
  };
}
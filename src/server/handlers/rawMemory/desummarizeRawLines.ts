/**
 * 删除RawMemory摘要处理器
 * 处理 desummarizeRawLines 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { RawMemory } from '../../../memory/RawMemory';
import {
  DesummarizeRawLinesRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';
import { NamePathHelper } from '../../../storage/NamePathHelper';

/**
 * 处理删除RawMemory摘要请求
 */
export async function desummarizeRawLinesHandler(
  storage: JsonStorage,
  request: DesummarizeRawLinesRequest
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

  // 保存删除前的摘要数量
  const beforeSummaries = rawMemory.summaries.length;

  // 执行删除摘要操作
  rawMemory.deleteSummary(lineBeg, lineEnd);

  // 计算实际删除的摘要数量
  const deletedSummaries = beforeSummaries - rawMemory.summaries.length;

  // 更新存储
  await setRaw(rawMemory);

  return {
    success: true,
    data: {
      message: `Summaries deleted successfully for lines ${lineBeg}-${lineEnd} in '${namePath}'`,
      lineBeg,
      lineEnd,
      deletedSummaries,
      beforeSummaries,
      afterSummaries: rawMemory.summaries.length
    }
  };
}
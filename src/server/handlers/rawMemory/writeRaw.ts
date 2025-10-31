/**
 * 写入RawMemory处理器
 * 处理 writeRaw 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { RawMemory } from '../../../memory/RawMemory';
import {
  WriteRawRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';
import { NamePathHelper } from '../../../storage/NamePathHelper';

/**
 * 处理写入RawMemory请求
 */
export async function writeRawHandler(
  storage: JsonStorage,
  request: WriteRawRequest
): Promise<MCPResponse> {
  const { namePath, data, isAppend = false } = request;

  // 解析namePath获取memory对象
  const [getRaw, setRaw] = NamePathHelper.GetAndUpdate(storage, namePath);
  const memory = getRaw();
  if (!memory || memory.type !== 'raw') {
    throw new MemoryNotFoundError(namePath);
  }

  const rawMemory = memory as RawMemory;

  // 验证输入
  if (typeof data !== 'string') {
    throw new ValidationError('data', 'Data must be a string');
  }

  // 执行写入操作
  if (isAppend) {
    rawMemory.append(data);
  } else {
    rawMemory.write(data);
  }

  // 更新存储
  await setRaw(rawMemory);

  return {
    success: true,
    data: {
      message: `Data ${isAppend ? 'appended to' : 'written to'} '${namePath}' successfully`,
      operation: isAppend ? 'append' : 'write',
      nLines: rawMemory.nLines,
      nChars: rawMemory.nChars
    }
  };
}
/**
 * 添加Memory处理器
 * 处理 addRawMemory、addListMemory、addGraphMemory 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { RawMemory } from '../../../memory/RawMemory';
import { ListMemory } from '../../../memory/ListMemory';
import {
  AddRawMemoryRequest,
  AddListMemoryRequest,
  AddGraphMemoryRequest,
  MCPResponse
} from '../../../types';
import {
  MemoryAlreadyExistsError,
  InvalidOperationError,
  ValidationError
} from '../../../utils/errors';

/**
 * 处理添加RawMemory请求
 */
export async function addRawMemoryHandler(
  storage: JsonStorage,
  request: AddRawMemoryRequest
): Promise<MCPResponse> {
  const { name, description, data } = request;

  // 检查是否已存在
  if (storage.hasMemory(name)) {
    throw new MemoryAlreadyExistsError(name);
  }

  // 创建新的RawMemory
  const rawMemory = new RawMemory(name, description, data);
  await storage.addMemory(rawMemory);

  return {
    success: true,
    data: {
      message: `RawMemory '${name}' created successfully`,
      type: 'raw',
      nLines: rawMemory.nLines,
      nChars: rawMemory.nChars
    }
  };
}

/**
 * 处理添加ListMemory请求
 */
export async function addListMemoryHandler(
  storage: JsonStorage,
  request: AddListMemoryRequest
): Promise<MCPResponse> {
  const { name, description, role } = request;

  // 检查是否已存在
  if (storage.hasMemory(name)) {
    throw new MemoryAlreadyExistsError(name);
  }

  // 创建新的ListMemory
  const listMemory = new ListMemory(name, description, role);
  await storage.addMemory(listMemory);

  return {
    success: true,
    data: {
      message: `ListMemory '${name}' created successfully`,
      type: 'list',
      role: role,
      listLength: listMemory.length
    }
  };
}

/**
 * 处理添加GraphMemory请求
 */
export async function addGraphMemoryHandler(
  storage: JsonStorage,
  request: AddGraphMemoryRequest
): Promise<MCPResponse> {
  const { name, description, role } = request;

  // 检查是否已存在
  if (storage.hasMemory(name)) {
    throw new MemoryAlreadyExistsError(name);
  }

  // GraphMemory暂时搁置，抛出未实现错误
  throw new InvalidOperationError('addGraphMemory', 'GraphMemory is not implemented yet');
}

/**
 * 统一的添加Memory处理器
 */
export const addMemoryHandler = {
  addRawMemory: addRawMemoryHandler,
  addListMemory: addListMemoryHandler,
  addGraphMemory: addGraphMemoryHandler
};
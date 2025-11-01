/**
 * 通过名称删除ListMemory元素处理器
 * 处理 deleteListElementByName 请求
 */

import { JsonStorage } from '../../../storage/JsonStorage';
import { ListMemory } from '../../../memory/ListMemory';
import {
  DeleteListElementByNameRequest,
  MCPResponse,
  ListMemoryMetadata
} from '../../../types';
import {
  MemoryNotFoundError,
  ValidationError
} from '../../../utils/errors';

/**
 * 处理通过名称删除ListMemory元素请求
 */
export async function deleteListElementByNameHandler(
  storage: JsonStorage,
  request: DeleteListElementByNameRequest
): Promise<MCPResponse> {
  const { name, child_name } = request;

  // 解析namePath获取memory对象
  const memory = storage.getMemory(name);
  if (!memory || memory.type !== 'list') {
    throw new MemoryNotFoundError(name);
  }

  const listMemory = ListMemory.fromJSON(memory as any);

  // 验证输入
  if (typeof child_name !== 'string') {
    throw new ValidationError('child_name', 'child_name must be a string');
  }

  // 查找指定名称的元素
  const targetMemory = listMemory.getByName(child_name);
  if (!targetMemory) {
    throw new MemoryNotFoundError(child_name);
  }

  // 找到元素在列表中的索引
  const elementIndex = listMemory.list.findIndex(item => item.name === child_name);
  if (elementIndex === -1) {
    throw new MemoryNotFoundError(child_name);
  }

  // 获取删除前的信息
  const beforeLength = listMemory.length;
  const deletedElement = listMemory.getAt(elementIndex);

  // 执行删除操作
  listMemory.removeAt(elementIndex);

  // 更新存储
  await storage.updateMemory(listMemory);

  // 添加ListMemory元数据，与searchMemory保持一致
  const metadata: ListMemoryMetadata = {
    length: listMemory.length,
    role: listMemory.role
  };

  return {
    success: true,
    data: {
      message: `Element '${child_name}' deleted successfully from '${name}'`,
      elementName: child_name,
      index: elementIndex,
      deletedElement: deletedElement ? deletedElement.toSmartJSON() : null,
      beforeLength,
      afterLength: listMemory.length,
      metadata
    }
  };
}
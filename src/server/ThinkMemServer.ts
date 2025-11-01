import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as fs from 'fs';
import { z } from 'zod';
import { VERSION } from '../version';

import { JsonStorage } from '../storage/JsonStorage';
import { RawMemory } from '../memory/RawMemory';
import { ListMemory } from '../memory/ListMemory';
import { SecretManager } from '../auth/SecretManager';
import {
  memoryHandlers,
  rawMemoryHandlers,
  listMemoryHandlers
} from './handlers';
import {
  ThinkMemError,
  MemoryNotFoundError,
  MemoryAlreadyExistsError,
  InvalidOperationError,
  ValidationError,
  MissingSecretError,
  InvalidSecretError
} from '../utils/errors';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport';


export class ThinkMemServer {
  private server: McpServer;
  private storage: JsonStorage;

  constructor(dbPath: string) {
    this.server = new McpServer(
      {
        name: 'thinkmem',
        version: VERSION,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    this.storage = new JsonStorage(dbPath);

    this.setupToolHandlers();
    this.setupPromptHandlers();
  }

  /**
   * 设置工具处理器
   */
  private setupToolHandlers(): void {
    this.setupSystemTools();
    this.setupMemoryManagementTools();
    this.setupRawMemoryTools();
    this.setupListMemoryTools();
  }

  /**
   * 系统工具
   */
  private setupSystemTools(): void {
    // 服务器状态检查工具
    this.server.registerTool(
      'serverStatus',
      {
        title: 'Server Status',
        description: '检查服务器运行状态和统计信息',
        inputSchema: { verbose: z.boolean().optional() },
        outputSchema: { status: z.string(), timestamp: z.string(), stats: z.any(), guide: z.string(), }
      },
      async ({ verbose }) => {
        try {
          const stats = this.getStats();
          const output = {
            status: 'running',
            timestamp: new Date().toISOString(),
            stats: verbose ? stats : {
              totalMemories: Object.keys(stats.memories || {}).length,
              lastModified: stats.lastModified
            },
            guide: 'Did you fully read `ThinkMemAIGuide`? If not, MUST read it before using or talking about it.',
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // AI助手指南工具
    this.server.registerTool(
      'ThinkMemAIGuide',
      {
        title: 'THINK-MEM AI助手指南',
        description: '获取完整的THINK-MEM AI助手操作指南，包含NamePath定位系统详解、实际应用范例和最佳实践。帮助AI助手快速掌握如何使用ThinkMem系统进行记忆管理和智能交互。当AI助手使用ThinkMem前务必阅读完整指南以获取secret。',
        inputSchema: {
          section: z.enum(['full', 'basic', 'namepath', 'examples', 'patterns']).optional().describe('指南部分：full=完整指南，basic=基础规范，namepath=NamePath详解，examples=应用范例'),
          assistant_name: z.string().describe('助手名称，用于个性化指南内容')
        },
        outputSchema: {
          success: z.boolean(),
          content: z.string(),
          section: z.string(),
          assistant_name: z.string(),
          secret: z.string().optional(),
        }
      },
      async ({ section = 'full', assistant_name = 'ThinkMem测试员' }) => {
        try {
          const content = await this.handleAIGuideRequest(section, assistant_name);

          let secret = undefined;
        if (section === 'full') {
          secret = SecretManager.generateSecret();
          await SecretManager.storeSecret(this.storage, secret);
        }

        const output = {
          success: true,
          content: content,
          section: section,
          assistant_name: assistant_name,
          secret: secret,
        };

          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );
  }

  /**
   * Memory 管理工具 (5个工具)
   */
  private setupMemoryManagementTools(): void {
    // 创建 RawMemory
    this.server.registerTool(
      'addRawMemory',
      {
        title: 'Add Raw Memory',
        description: '创建一个新的RawMemory存储块，用于存储无结构的原始文本数据。支持后续的文本编辑、摘要管理和智能搜索功能。',
        inputSchema: {
          name: z.string(),
          description: z.string(),
          data: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, description, data, secret }) => {
        try {
          this.validateSecret(secret);
          const result = memoryHandlers.addMemoryHandler.addRawMemory(this.storage, { name, description, data });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 创建 ListMemory
    this.server.registerTool(
      'addListMemory',
      {
        title: 'Add List Memory',
        description: '创建一个新的ListMemory存储块，作为有序集合使用。支持array（数组）、deque（双端队列）、stack（栈）三种角色模式。',
        inputSchema: {
          name: z.string(),
          description: z.string(),
          role: z.enum(['array', 'deque', 'stack']),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, description, role, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await memoryHandlers.addMemoryHandler.addListMemory(this.storage, { name, description, role });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 创建 GraphMemory
    this.server.registerTool(
      'addGraphMemory',
      {
        title: 'Add Graph Memory',
        description: '创建一个新的GraphMemory存储块，用于表示图结构数据。支持tree（树结构）和graph（图结构）两种模式，适用于知识图谱、关系网络等场景。',
        inputSchema: {
          name: z.string(),
          description: z.string(),
          role: z.enum(['tree', 'graph']),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, description, role, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await memoryHandlers.addMemoryHandler.addGraphMemory(this.storage, { name, description, role });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 删除 Memory
    this.server.registerTool(
      'deleteMemory',
      {
        title: 'Delete Memory',
        description: '删除指定的Memory存储块及其包含的所有数据。',
        inputSchema: {
          name: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await memoryHandlers.deleteMemoryHandler(this.storage, { name });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 搜索 Memory
    this.server.registerTool(
      'searchMemory',
      {
        title: 'Search Memory',
        description: '搜索和筛选Memory存储块，支持按名称模式匹配和按类型过滤。返回符合条件的Memory列表。默认支持不区分大小写正则表达式。可空以获取全部。',
        inputSchema: {
          query: z.object({
            pattern: z.string().optional(),
            type: z.enum(['raw', 'list', 'graph']).optional()
          }).optional(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ query, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await memoryHandlers.searchMemoryHandler(this.storage, query ? { query } : { query: {} });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );
  }

  /**
   * RawMemory 操作工具 (8个工具)
   */
  private setupRawMemoryTools(): void {
    // 写入 RawMemory
    this.server.registerTool(
      'writeRaw',
      {
        title: 'Write Raw',
        description: '向RawMemory写入文本内容，支持覆盖模式或追加模式。',
        inputSchema: {
          namePath: z.string(),
          data: z.string(),
          isAppend: z.boolean().optional(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ namePath, data, isAppend, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await rawMemoryHandlers.writeRawHandler(this.storage, { namePath, data, isAppend: isAppend || false });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 替换 RawMemory 行
    this.server.registerTool(
      'replaceRawLines',
      {
        title: 'Replace Raw Lines',
        description: '替换RawMemory中指定行范围的文本内容，支持模式匹配定位。',
        inputSchema: {
          namePath: z.string(),
          lineBeg: z.number(),
          lineEnd: z.number(),
          pattern: z.string(),
          text: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ namePath, lineBeg, lineEnd, pattern, text, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await rawMemoryHandlers.replaceRawLinesHandler(this.storage, { namePath, lineBeg, lineEnd, pattern, text });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 删除 RawMemory 行
    this.server.registerTool(
      'deleteRawLines',
      {
        title: 'Delete Raw Lines',
        description: '删除RawMemory中指定行范围的文本内容，后续行会自动前移。',
        inputSchema: {
          namePath: z.string(),
          lineBeg: z.number(),
          lineEnd: z.number(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ namePath, lineBeg, lineEnd, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await rawMemoryHandlers.deleteRawLinesHandler(this.storage, { namePath, lineBeg, lineEnd });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 插入 RawMemory 行
    this.server.registerTool(
      'insertRawLines',
      {
        title: 'Insert Raw Lines',
        description: '在RawMemory指定行位置插入新文本内容，原位置行及后续行会自动后移。',
        inputSchema: {
          namePath: z.string(),
          lineNo: z.number(),
          text: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ namePath, lineNo, text, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await rawMemoryHandlers.insertRawLinesHandler(this.storage, { namePath, lineNo, text });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 添加摘要
    this.server.registerTool(
      'summarizeRawLines',
      {
        title: 'Summarize Raw Lines',
        description: '为RawMemory的指定行范围添加摘要文本。摘要用于对大段文本进行概括性描述，便于快速理解和检索。粒度可以较细。此过程应该由工具调用方自觉主动完成。',
        inputSchema: {
          namePath: z.string(),
          lineBeg: z.number(),
          lineEnd: z.number(),
          text: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ namePath, lineBeg, lineEnd, text, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await rawMemoryHandlers.summarizeRawLinesHandler(this.storage, { namePath, lineBeg, lineEnd, text });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 删除摘要
    this.server.registerTool(
      'desummarizeRawLines',
      {
        title: 'Desummarize Raw Lines',
        description: '删除RawMemory指定行范围的摘要，不影响原始文本内容。',
        inputSchema: {
          namePath: z.string(),
          lineBeg: z.number(),
          lineEnd: z.number(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ namePath, lineBeg, lineEnd, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await rawMemoryHandlers.desummarizeRawLinesHandler(this.storage, { namePath, lineBeg, lineEnd });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 读取 RawMemory 行
    this.server.registerTool(
      'readRawLines',
      {
        title: 'Read Raw Lines',
        description: '读取RawMemory的文本内容，支持原始数据读取和智能摘要模式。',
        inputSchema: {
          namePath: z.string(),
          lineBeg: z.number().optional(),
          lineEnd: z.number().optional(),
          summarize: z.boolean().optional(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ namePath, lineBeg, lineEnd, summarize, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await rawMemoryHandlers.readRawLinesHandler(this.storage, { namePath, lineBeg, lineEnd, summarize: summarize || false });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 搜索 RawMemory 行
    this.server.registerTool(
      'searchRawLines',
      {
        title: 'Search Raw Lines',
        description: '在RawMemory中搜索包含指定模式的文本行。返回匹配的行号和行内容，默认支持不区分大小写正则表达式。可空以获取全部。',
        inputSchema: {
          namePath: z.string(),
          pattern: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ namePath, pattern, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await rawMemoryHandlers.searchRawLinesHandler(this.storage, { namePath, pattern });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );
  }

  /**
   * ListMemory 操作工具 (16个工具)
   */
  private setupListMemoryTools(): void {
    // 添加元素到末尾
    this.server.registerTool(
      'appendListElement',
      {
        title: 'Append List Element',
        description: '在ListMemory的末尾添加新元素。适用于所有角色模式的ListMemory，但仅建议在array模式下使用。',
        inputSchema: {
          name: z.string(),
          child_name: z.string(),
          data: z.string(),
          description: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, child_name, data, description, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.appendListElementHandler(this.storage, { name, child_name, data, description });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 双端队列推入元素
    this.server.registerTool(
      'pushDequeElement',
      {
        title: 'Push Deque Element',
        description: '在双端队列模式ListMemory的前端或后端添加元素。',
        inputSchema: {
          name: z.string(),
          child_name: z.string(),
          data: z.string(),
          description: z.string(),
          position: z.enum(['front', 'back']),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, child_name, data, description, position, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.pushDequeElementHandler(this.storage, { name, child_name, data, description, position });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 栈推入元素
    this.server.registerTool(
      'pushStackElement',
      {
        title: 'Push Stack Element',
        description: '在栈模式ListMemory的顶部添加新元素，遵循后进先出原则。',
        inputSchema: {
          name: z.string(),
          child_name: z.string(),
          data: z.string(),
          description: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, child_name, data, description, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.pushStackElementHandler(this.storage, { name, child_name, data, description });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 插入元素到指定位置
    this.server.registerTool(
      'insertListElement',
      {
        title: 'Insert List Element',
        description: '在ListMemory的指定位置插入新元素，用于精确控制元素顺序。',
        inputSchema: {
          name: z.string(),
          child_name: z.string(),
          index: z.number(),
          data: z.string(),
          description: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, child_name, index, data, description, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.insertListElementHandler(this.storage, { name, child_name, index, data, description });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 按索引删除元素
    this.server.registerTool(
      'deleteListElement',
      {
        title: 'Delete List Element',
        description: '删除ListMemory中指定位置的元素，后续元素会自动前移。',
        inputSchema: {
          name: z.string(),
          index: z.number(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, index, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.deleteListElementHandler(this.storage, { name, index });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 按名称删除元素
    this.server.registerTool(
      'deleteListElementByName',
      {
        title: 'Delete List Element By Name',
        description: '根据元素名称删除ListMemory中的指定元素，利用名称唯一性机制定位。',
        inputSchema: {
          name: z.string(),
          child_name: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, child_name, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.deleteListElementByNameHandler(this.storage, { name, child_name });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 双端队列弹出元素
    this.server.registerTool(
      'popDequeElement',
      {
        title: 'Pop Deque Element',
        description: '从双端队列模式ListMemory的前端或后端弹出元素，遵循先进先出或后进先出原则。',
        inputSchema: {
          name: z.string(),
          position: z.enum(['front', 'back']),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, position, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.popDequeElementHandler(this.storage, { name, position });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 栈弹出元素
    this.server.registerTool(
      'popStackElement',
      {
        title: 'Pop Stack Element',
        description: '从栈模式ListMemory的顶部弹出元素，遵循后进先出原则。',
        inputSchema: {
          name: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.popStackElementHandler(this.storage, { name });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 清空列表
    this.server.registerTool(
      'clearList',
      {
        title: 'Clear List',
        description: '清空ListMemory中的所有元素，此操作不可逆。',
        inputSchema: {
          name: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.clearListHandler(this.storage, { name });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 获取列表元素
    this.server.registerTool(
      'getListElement',
      {
        title: 'Get List Element',
        description: '获取ListMemory中指定位置的元素内容，仅用于查询操作。',
        inputSchema: {
          name: z.string(),
          index: z.number(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, index, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.getListElementHandler(this.storage, { name, index });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 查看双端队列元素
    this.server.registerTool(
      'peekDequeElement',
      {
        title: 'Peek Deque Element',
        description: '查看双端队列模式ListMemory的前端或后端元素，用于预览队列状态。',
        inputSchema: {
          name: z.string(),
          position: z.enum(['front', 'back']),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, position, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.peekDequeElementHandler(this.storage, { name, position });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 查看栈元素
    this.server.registerTool(
      'peekStackElement',
      {
        title: 'Peek Stack Element',
        description: '查看栈模式ListMemory的顶部元素，用于预览栈顶状态。',
        inputSchema: {
          name: z.string(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.peekStackElementHandler(this.storage, { name });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );

    // 搜索列表元素
    this.server.registerTool(
      'searchListElements',
      {
        title: 'Search List Elements',
        description: '搜索ListMemory中名称中包含指定模式的元素。返回匹配的元素索引和内容，默认支持不区分大小写正则表达式。可空以获取全部。',
        inputSchema: {
          name: z.string(),
          pattern: z.string().optional(),
          secret: z.string()
        },
        outputSchema: { success: z.boolean(), result: z.any() }
      },
      async ({ name, pattern, secret }) => {
        try {
          this.validateSecret(secret);
          const result = await listMemoryHandlers.searchListElementsHandler(this.storage, { name, pattern });
          const output = { success: true, result };
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
            structuredContent: output
          };
        } catch (error) {
          return this.handleError(error);
        }
      }
    );
  }

  private handleError(error: unknown): { content: Array<{ type: 'text'; text: string }>; isError?: boolean } {
    if (error instanceof ThinkMemError) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error.message,
              code: error.code,
              details: error.details
            }, null, 2)
          }
        ],
        isError: true
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }, null, 2)
        }
      ],
      isError: true
    };
  }

  /**
   * 启动服务器（stdio模式）
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.connect(transport);
  }

  /**
   * 内核McpServer连接到Transport，暴露用于express
   */
  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  /**
   * 关闭服务器
   */
  async close(): Promise<void> {
    await this.storage.close();
  }


  /**
   * 获取存储统计信息
   */
  getStats(): any {
    return this.storage.getStats();
  }

  /**
   * 从指南中提取指定章节内容
   */
  private extractSection(fullGuide: string, startMarker: string, endMarker: string): string {
    const startIndex = fullGuide.indexOf(startMarker);
    const endIndex = fullGuide.indexOf(endMarker);

    if (startIndex === -1) {
      return `未找到章节: ${startMarker}`;
    }

    if (endIndex === -1) {
      return fullGuide.substring(startIndex);
    }

    return fullGuide.substring(startIndex, endIndex);
  }

  /**
   * AI助手指南共享处理器
   */
  private async handleAIGuideRequest(section: string = 'full', assistant_name: string = 'ThinkMem测试员'): Promise<any> {
    try {
      const fs = await import('fs');
      const path = await import('path');

      // 读取LLM提示词模板文件
      const guidePath = path.join(process.cwd(), 'LLM_PROMPT_TEMPLATE.md');
      let fullGuide = '';

      try {
        fullGuide = fs.readFileSync(guidePath, 'utf-8');
      } catch (error) {
        // 如果文件不存在，返回基础指南
        fullGuide = "ThinkMem文档不完整，请勿使用ThinkMem。请联系系统管理员补全LLM_PROMPT_TEMPLATE.md文件。";
      }

      // 个性化助手名称
      let personalizedGuide = fullGuide.replace(/ThinkMem测试员/g, assistant_name);

      // 根据请求的section返回相应内容
      let content = '';
      switch (section) {
        case 'basic':
          content = this.extractSection(personalizedGuide, '## 基础规范', '## NamePath');
          break;
        case 'namepath':
          content = this.extractSection(personalizedGuide, '## NamePath 定位系统详解', '## 具体应用详解');
          break;
        case 'examples':
          content = this.extractSection(personalizedGuide, '## 具体应用详解', '## 结束');
          break;
        case 'full':
        default:
          content = personalizedGuide;
          break;
      }

      return content;
    } catch (error) {
      // 如果出错，返回错误信息
      return `获取THINK-MEM AI助手指南时出错: ${error instanceof Error ? error.message : String(error)}\n\n请检查LLM_PROMPT_TEMPLATE.md文件是否存在。`;
    }
  }

  /**
   * 验证secret令牌
   */
  private async validateSecret(secret: string | undefined): Promise<void> {
    if (!secret) {
      throw new MissingSecretError('Missing secret token. Please read the full ThinkMemAIGuide to obtain a secret token.');
    }

    if (!SecretManager.validateSecret(secret)) {
      throw new InvalidSecretError('Invalid secret token format. Please obtain a new secret from ThinkMemAIGuide.');
    }

    // 验证存储的secret
    const isValid = await SecretManager.validateStoredSecret(this.storage, secret);
    if (!isValid) {
      throw new InvalidSecretError('Invalid or expired secret token. Please obtain a new secret from ThinkMemAIGuide.');
    }
  }

  /**
   * 设置Prompt处理器
   */
  private setupPromptHandlers(): void {
    this.setupAIGuidePrompt();
  }

  /**
   * AI助手指南Prompt
   */
  private setupAIGuidePrompt(): void {
    this.server.registerPrompt(
      'ThinkMemAIGuide',
      {
        title: 'THINK-MEM AI助手指南',
        description: '提供完整的THINK-MEM AI助手操作指南，包含NamePath定位系统详解、实际应用范例和最佳实践。帮助AI助手快速掌握如何使用ThinkMem系统进行记忆管理和智能交互。当AI助手阅读到本描述的时候（在服务用户之前）务必阅读本指南。',
        argsSchema: {
          section: z.enum(['full', 'basic', 'namepath', 'examples', 'patterns']).optional().describe('指南部分：full=完整指南，basic=基础规范，namepath=NamePath详解，examples=应用范例'),
          assistant_name: z.string().optional().describe('助手名称，用于个性化指南内容')
        }
      },
      async ({ section = 'full', assistant_name = 'ThinkMem测试员' }) => {
        const content = await this.handleAIGuideRequest(section, assistant_name);

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: content
              }
            }
          ]
        };
      }
    );
  }
}
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { JsonStorage } from '../storage/JsonStorage';
import { RawMemory } from '../memory/RawMemory';
import { ListMemory } from '../memory/ListMemory';
import {
  memoryHandlers,
  rawMemoryHandlers,
  listMemoryHandlers
} from './handlers';
import {
  MCPRequest,
  MCPResponse,
  AddRawMemoryRequest,
  AddListMemoryRequest,
  AddGraphMemoryRequest,
  DeleteMemoryRequest,
  SearchMemoryRequest,
  SearchMemoryResponse,
  WriteRawRequest,
  ReplaceRawLinesRequest,
  DeleteRawLinesRequest,
  InsertRawLinesRequest,
  SummarizeRawLinesRequest,
  DesummarizeRawLinesRequest,
  ReadRawLinesRequest,
  ReadRawLinesResponse,
  SearchRawLinesRequest,
  SearchRawLinesResponse,
  AppendListElementRequest,
  PushDequeElementRequest,
  PushStackElementRequest,
  InsertListElementRequest,
  DeleteListElementRequest,
  PopDequeElementRequest,
  PopStackElementRequest,
  ClearListRequest,
  GetListElementRequest,
  GetListElementResponse,
  PeekDequeElementRequest,
  PeekStackElementRequest,
  SearchListElementsRequest,
  SearchListElementsResponse,
} from '../types';
import {
  ThinkMemError,
  MemoryNotFoundError,
  MemoryAlreadyExistsError,
  InvalidOperationError,
  ValidationError
} from '../utils/errors';

export class ThinkMemServer {
  private server: Server;
  private storage: JsonStorage;

  constructor(dbPath: string) {
    this.server = new Server(
      {
        name: 'thinkmem',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.storage = new JsonStorage(dbPath);
    this.setupToolHandlers();
  }

  /**
   * 设置工具处理器
   */
  private setupToolHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Memory管理工具
          {
            name: 'addRawMemory',
            description: '创建一个新的RawMemory存储块，用于存储无结构的原始文本数据。支持后续的文本编辑、摘要管理和智能搜索功能。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Memory存储块的唯一标识符名称'
                },
                description: {
                  type: 'string',
                  description: 'Memory存储块的详细描述，用于说明存储内容的用途和特征'
                },
                data: {
                  type: 'string',
                  description: '要存储的原始文本数据内容'
                }
              },
              required: ['name', 'description', 'data']
            }
          },
          {
            name: 'addListMemory',
            description: '创建一个新的ListMemory存储块，作为有序集合使用。支持array（数组）、deque（双端队列）、stack（栈）三种角色模式。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的唯一标识符名称'
                },
                description: {
                  type: 'string',
                  description: 'ListMemory存储块的详细描述，说明其用途和使用场景'
                },
                role: {
                  type: 'string',
                  enum: ['array', 'deque', 'stack'],
                  description: '列表的角色模式：array为普通数组，deque为双端队列（支持前后端操作），stack为栈（支持后进先出操作）'
                }
              },
              required: ['name', 'description', 'role']
            }
          },
          {
            name: 'addGraphMemory',
            description: '创建一个新的GraphMemory存储块，用于表示图结构数据。支持tree（树结构）和graph（图结构）两种模式，适用于知识图谱、关系网络等场景。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'GraphMemory存储块的唯一标识符名称'
                },
                description: {
                  type: 'string',
                  description: 'GraphMemory存储块的详细描述，说明图的用途和结构特征'
                },
                role: {
                  type: 'string',
                  enum: ['tree', 'graph'],
                  description: '图的角色模式：tree为树结构（有根节点的层次结构），graph为图结构（网络结构，无明确根节点）'
                }
              },
              required: ['name', 'description', 'role']
            }
          },
          {
            name: 'deleteMemory',
            description: '删除指定名称的Memory存储块及其所有数据。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: '要删除的Memory存储块的名称'
                }
              },
              required: ['name']
            }
          },
          {
            name: 'searchMemory',
            description: '搜索和筛选Memory存储块，支持按名称模式匹配和按类型过滤。返回符合条件的Memory列表。默认支持不区分大小写正则表达式。可空以获取全部。',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'object',
                  description: '搜索条件，支持模式匹配和类型过滤',
                  properties: {
                    pattern: {
                      type: 'string',
                      description: '名称模式匹配字符串，支持部分匹配来查找Memory名称。可空以获取全部。'
                    },
                    type: {
                      type: 'string',
                      enum: ['raw', 'list', 'graph'],
                      description: '按Memory类型过滤：raw为原始文本，list为列表，graph为图结构'
                    }
                  }
                }
              }
            }
          },

          // RawMemory操作工具
          {
            name: 'writeRaw',
            description: '向RawMemory写入文本内容，支持覆盖模式和追加模式。覆盖模式会替换全部内容，追加模式在末尾添加新内容。',
            inputSchema: {
              type: 'object',
              properties: {
                namePath: {
                  type: 'string',
                  description: 'RawMemory的定位路径，对于顶级RawMemory直接使用名称，对于嵌套在ListMemory中的使用 "list_name<:index:>" 或 "list_name<::>child_name" 格式'
                },
                data: {
                  type: 'string',
                  description: '要写入的文本内容'
                },
                isAppend: {
                  type: 'boolean',
                  description: '是否为追加模式。true表示在现有内容末尾另起一行追加，false表示覆盖全部内容。默认为false'
                }
              },
              required: ['namePath', 'data']
            }
          },
          {
            name: 'replaceRawLines',
            description: '替换RawMemory中指定行范围的文本内容。支持模式匹配来精确定位要替换的文本片段。',
            inputSchema: {
              type: 'object',
              properties: {
                namePath: {
                  type: 'string',
                  description: 'RawMemory的定位路径'
                },
                lineBeg: {
                  type: 'number',
                  description: '起始行号（从0开始计数，包含该行）'
                },
                lineEnd: {
                  type: 'number',
                  description: '结束行号（从0开始计数，包含该行）'
                },
                pattern: {
                  type: 'string',
                  description: '用于精确匹配的模式字符串，只有匹配该模式的文本才会被替换'
                },
                text: {
                  type: 'string',
                  description: '替换后的新文本内容'
                }
              },
              required: ['namePath', 'lineBeg', 'lineEnd', 'pattern', 'text']
            }
          },
          {
            name: 'deleteRawLines',
            description: '删除RawMemory中指定行范围的文本内容。删除后后面的行会自动前移。',
            inputSchema: {
              type: 'object',
              properties: {
                namePath: {
                  type: 'string',
                  description: 'RawMemory的定位路径'
                },
                lineBeg: {
                  type: 'number',
                  description: '起始行号（从0开始计数，包含该行）'
                },
                lineEnd: {
                  type: 'number',
                  description: '结束行号（从0开始计数，包含该行）'
                }
              },
              required: ['namePath', 'lineBeg', 'lineEnd']
            }
          },
          {
            name: 'insertRawLines',
            description: '在RawMemory的指定行位置插入新文本内容。原位置的行及后续行会自动后移。',
            inputSchema: {
              type: 'object',
              properties: {
                namePath: {
                  type: 'string',
                  description: 'RawMemory的定位路径'
                },
                lineNo: {
                  type: 'number',
                  description: '插入位置的行号（从0开始计数），新内容将插入到该行之前'
                },
                text: {
                  type: 'string',
                  description: '要插入的文本内容'
                }
              },
              required: ['namePath', 'lineNo', 'text']
            }
          },
          {
            name: 'summarizeRawLines',
            description: '为RawMemory的指定行范围添加摘要文本。摘要用于对大段文本进行概括性描述，便于快速理解和检索。粒度可以较细。此过程应该由工具调用方自觉主动完成。',
            inputSchema: {
              type: 'object',
              properties: {
                namePath: {
                  type: 'string',
                  description: 'RawMemory的定位路径'
                },
                lineBeg: {
                  type: 'number',
                  description: '摘要覆盖的起始行号（从0开始计数，包含该行）'
                },
                lineEnd: {
                  type: 'number',
                  description: '摘要覆盖的结束行号（从0开始计数，包含该行）'
                },
                text: {
                  type: 'string',
                  description: '摘要文本内容，应该简明扼要地概括对应行范围的主要信息'
                }
              },
              required: ['namePath', 'lineBeg', 'lineEnd', 'text']
            }
          },
          {
            name: 'desummarizeRawLines',
            description: '删除RawMemory指定行范围的摘要。删除摘要不会影响原始文本内容。',
            inputSchema: {
              type: 'object',
              properties: {
                namePath: {
                  type: 'string',
                  description: 'RawMemory的定位路径'
                },
                lineBeg: {
                  type: 'number',
                  description: '要删除摘要的起始行号（从0开始计数，包含该行）'
                },
                lineEnd: {
                  type: 'number',
                  description: '要删除摘要的结束行号（从0开始计数，包含该行）'
                }
              },
              required: ['namePath', 'lineBeg', 'lineEnd']
            }
          },
          {
            name: 'readRawLines',
            description: '读取RawMemory的文本内容，支持原始数据读取和智能摘要模式。智能模式会优先返回摘要，提高阅读效率。使用此工具即使通读全文（不指定beg和end），也不会返回RawMemory的元数据（总行数、总字符数），而searchMemory则会返回。',
            inputSchema: {
              type: 'object',
              properties: {
                namePath: {
                  type: 'string',
                  description: 'RawMemory的定位路径'
                },
                lineBeg: {
                  type: 'number',
                  description: '读取的起始行号（从0开始计数，包含该行），不指定则从开头读取'
                },
                lineEnd: {
                  type: 'number',
                  description: '读取的结束行号（从0开始计数，包含该行），不指定则读到结尾'
                },
                summarize: {
                  type: 'boolean',
                  description: '是否启用智能摘要模式。true模式下优先返回摘要而非原始文本，提高阅读效率。默认为false'
                }
              },
              required: ['namePath']
            }
          },
          {
            name: 'searchRawLines',
            description: '在RawMemory中搜索包含指定模式的文本行。返回匹配的行号和行内容，默认支持不区分大小写正则表达式。可空以获取全部。',
            inputSchema: {
              type: 'object',
              properties: {
                namePath: {
                  type: 'string',
                  description: 'RawMemory的定位路径'
                },
                pattern: {
                  type: 'string',
                  description: '要搜索的文本模式，支持部分匹配和包含关系查找'
                }
              },
              required: ['namePath', 'pattern']
            }
          },

          // ListMemory操作工具
          {
            name: 'appendListElement',
            description: '在ListMemory的末尾添加新元素。适用于所有角色模式的ListMemory，但仅建议在array模式下使用。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称'
                },
                data: {
                  type: 'string',
                  description: '新元素的文本数据内容'
                },
                description: {
                  type: 'string',
                  description: '新元素的描述信息，用于说明该元素的用途和内容特征'
                }
              },
              required: ['name', 'data', 'description']
            }
          },
          {
            name: 'pushDequeElement',
            description: '在双端队列模式ListMemory的前端或后端添加元素。front为前端插入，back为后端插入。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称（必须为deque角色）'
                },
                data: {
                  type: 'string',
                  description: '新元素的文本数据内容'
                },
                description: {
                  type: 'string',
                  description: '新元素的描述信息'
                },
                position: {
                  type: 'string',
                  enum: ['front', 'back'],
                  description: '插入位置：front为前端插入（队列头部），back为后端插入（队列尾部）'
                }
              },
              required: ['name', 'data', 'description', 'position']
            }
          },
          {
            name: 'pushStackElement',
            description: '在栈模式ListMemory的顶部添加新元素。遵循后进先出（LIFO）原则。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称（必须为stack角色）'
                },
                data: {
                  type: 'string',
                  description: '新元素的文本数据内容'
                },
                description: {
                  type: 'string',
                  description: '新元素的描述信息'
                }
              },
              required: ['name', 'data', 'description']
            }
          },
          {
            name: 'insertListElement',
            description: '在ListMemory的指定位置插入新元素。适用于需要精确控制元素顺序的场景。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称'
                },
                index: {
                  type: 'number',
                  description: '插入位置的索引（从0开始计数），新元素将插入到该位置'
                },
                data: {
                  type: 'string',
                  description: '新元素的文本数据内容'
                },
                description: {
                  type: 'string',
                  description: '新元素的描述信息'
                }
              },
              required: ['name', 'index', 'data', 'description']
            }
          },
          {
            name: 'deleteListElement',
            description: '删除ListMemory中指定位置的元素。删除后后面的元素会自动前移。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称'
                },
                index: {
                  type: 'number',
                  description: '要删除元素的索引位置（从0开始计数）'
                }
              },
              required: ['name', 'index']
            }
          },
          {
            name: 'popDequeElement',
            description: '从双端队列模式ListMemory的前端或后端弹出元素。遵循先进先出（FIFO）或后进先出（LIFO）原则。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称（必须为deque角色）'
                },
                position: {
                  type: 'string',
                  enum: ['front', 'back'],
                  description: '弹出位置：front为前端弹出（队列头部，先进先出），back为后端弹出（队列尾部，后进先出）'
                }
              },
              required: ['name', 'position']
            }
          },
          {
            name: 'popStackElement',
            description: '从栈模式ListMemory的顶部弹出元素。遵循后进先出（LIFO）原则。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称（必须为stack角色）'
                }
              },
              required: ['name']
            }
          },
          {
            name: 'clearList',
            description: '清空ListMemory中的所有元素。此操作不可逆，请谨慎使用。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称'
                }
              },
              required: ['name']
            }
          },
          {
            name: 'getListElement',
            description: '获取ListMemory中指定位置的元素内容。不会修改列表状态，仅用于查询。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称'
                },
                index: {
                  type: 'number',
                  description: '要获取元素的索引位置（从0开始计数）'
                }
              },
              required: ['name', 'index']
            }
          },
          {
            name: 'peekDequeElement',
            description: '查看双端队列模式ListMemory的前端或后端元素，但不移除。用于预览队列状态。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称（必须为deque角色）'
                },
                position: {
                  type: 'string',
                  enum: ['front', 'back'],
                  description: '查看位置：front为前端（队列头部），back为后端（队列尾部）'
                }
              },
              required: ['name', 'position']
            }
          },
          {
            name: 'peekStackElement',
            description: '查看栈模式ListMemory的顶部元素，但不移除。用于预览栈顶状态。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称（必须为stack角色）'
                }
              },
              required: ['name']
            }
          },
          {
            name: 'searchListElements',
            description: '搜索ListMemory中包含指定模式的元素。返回匹配的元素索引和内容，默认支持不区分大小写正则表达式。可空以获取全部。',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'ListMemory存储块的名称'
                },
                pattern: {
                  type: 'string',
                  description: '要搜索的文本模式，在元素的数据和描述中进行匹配查找'
                }
              },
              required: ['name']
            }
          }
        ]
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;

      try {
        let result: MCPResponse;

        // 根据工具名称分发到对应的处理器
        switch (toolName) {
          // Memory管理工具
          case 'addRawMemory':
            result = await this.handleAddRawMemory(request.params.arguments as unknown as AddRawMemoryRequest);
            break;
          case 'addListMemory':
            result = await this.handleAddListMemory(request.params.arguments as unknown as AddListMemoryRequest);
            break;
          case 'addGraphMemory':
            result = await this.handleAddGraphMemory(request.params.arguments as unknown as AddGraphMemoryRequest);
            break;
          case 'deleteMemory':
            result = await this.handleDeleteMemory(request.params.arguments as unknown as DeleteMemoryRequest);
            break;
          case 'searchMemory':
            result = await this.handleSearchMemory(request.params.arguments as unknown as SearchMemoryRequest);
            break;

          // RawMemory操作工具
          case 'writeRaw':
            result = await this.handleWriteRaw(request.params.arguments as unknown as WriteRawRequest);
            break;
          case 'replaceRawLines':
            result = await this.handleReplaceRawLines(request.params.arguments as unknown as ReplaceRawLinesRequest);
            break;
          case 'deleteRawLines':
            result = await this.handleDeleteRawLines(request.params.arguments as unknown as DeleteRawLinesRequest);
            break;
          case 'insertRawLines':
            result = await this.handleInsertRawLines(request.params.arguments as unknown as InsertRawLinesRequest);
            break;
          case 'summarizeRawLines':
            result = await this.handleSummarizeRawLines(request.params.arguments as unknown as SummarizeRawLinesRequest);
            break;
          case 'desummarizeRawLines':
            result = await this.handleDesummarizeRawLines(request.params.arguments as unknown as DesummarizeRawLinesRequest);
            break;
          case 'readRawLines':
            result = await this.handleReadRawLines(request.params.arguments as unknown as ReadRawLinesRequest);
            break;
          case 'searchRawLines':
            result = await this.handleSearchRawLines(request.params.arguments as unknown as SearchRawLinesRequest);
            break;

          // ListMemory操作工具
          case 'appendListElement':
            result = await this.handleAppendListElement(request.params.arguments as unknown as AppendListElementRequest);
            break;
          case 'pushDequeElement':
            result = await this.handlePushDequeElement(request.params.arguments as unknown as PushDequeElementRequest);
            break;
          case 'pushStackElement':
            result = await this.handlePushStackElement(request.params.arguments as unknown as PushStackElementRequest);
            break;
          case 'insertListElement':
            result = await this.handleInsertListElement(request.params.arguments as unknown as InsertListElementRequest);
            break;
          case 'deleteListElement':
            result = await this.handleDeleteListElement(request.params.arguments as unknown as DeleteListElementRequest);
            break;
          case 'popDequeElement':
            result = await this.handlePopDequeElement(request.params.arguments as unknown as PopDequeElementRequest);
            break;
          case 'popStackElement':
            result = await this.handlePopStackElement(request.params.arguments as unknown as PopStackElementRequest);
            break;
          case 'clearList':
            result = await this.handleClearList(request.params.arguments as unknown as ClearListRequest);
            break;
          case 'getListElement':
            result = await this.handleGetListElement(request.params.arguments as unknown as GetListElementRequest);
            break;
          case 'peekDequeElement':
            result = await this.handlePeekDequeElement(request.params.arguments as unknown as PeekDequeElementRequest);
            break;
          case 'peekStackElement':
            result = await this.handlePeekStackElement(request.params.arguments as unknown as PeekStackElementRequest);
            break;
          case 'searchListElements':
            result = await this.handleSearchListElements(request.params.arguments as unknown as SearchListElementsRequest);
            break;

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${toolName}`
            );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        if (error instanceof ThinkMemError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                  code: error.code,
                  details: error.details
                }, null, 2)
              }
            ]
          };
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Internal server error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  
  // Memory管理处理器
  private async handleAddRawMemory(request: AddRawMemoryRequest): Promise<MCPResponse> {
    return memoryHandlers.addMemoryHandler.addRawMemory(this.storage, request);
  }

  private async handleAddListMemory(request: AddListMemoryRequest): Promise<MCPResponse> {
    return memoryHandlers.addMemoryHandler.addListMemory(this.storage, request);
  }

  private async handleAddGraphMemory(request: AddGraphMemoryRequest): Promise<MCPResponse> {
    return memoryHandlers.addMemoryHandler.addGraphMemory(this.storage, request);
  }

  private async handleDeleteMemory(request: DeleteMemoryRequest): Promise<MCPResponse> {
    return memoryHandlers.deleteMemoryHandler(this.storage, request);
  }

  private async handleSearchMemory(request: SearchMemoryRequest): Promise<MCPResponse> {
    return memoryHandlers.searchMemoryHandler(this.storage, request);
  }

  // RawMemory操作处理器
  private async handleWriteRaw(request: WriteRawRequest): Promise<MCPResponse> {
    return rawMemoryHandlers.writeRawHandler(this.storage, request);
  }

  private async handleReplaceRawLines(request: ReplaceRawLinesRequest): Promise<MCPResponse> {
    return rawMemoryHandlers.replaceRawLinesHandler(this.storage, request);
  }

  private async handleDeleteRawLines(request: DeleteRawLinesRequest): Promise<MCPResponse> {
    return rawMemoryHandlers.deleteRawLinesHandler(this.storage, request);
  }

  private async handleInsertRawLines(request: InsertRawLinesRequest): Promise<MCPResponse> {
    return rawMemoryHandlers.insertRawLinesHandler(this.storage, request);
  }

  private async handleSummarizeRawLines(request: SummarizeRawLinesRequest): Promise<MCPResponse> {
    return rawMemoryHandlers.summarizeRawLinesHandler(this.storage, request);
  }

  private async handleDesummarizeRawLines(request: DesummarizeRawLinesRequest): Promise<MCPResponse> {
    return rawMemoryHandlers.desummarizeRawLinesHandler(this.storage, request);
  }

  private async handleReadRawLines(request: ReadRawLinesRequest): Promise<MCPResponse> {
    return rawMemoryHandlers.readRawLinesHandler(this.storage, request);
  }

  private async handleSearchRawLines(request: SearchRawLinesRequest): Promise<MCPResponse> {
    return rawMemoryHandlers.searchRawLinesHandler(this.storage, request);
  }

  // ListMemory操作处理器
  private async handleAppendListElement(request: AppendListElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.appendListElementHandler(this.storage, request);
  }

  private async handlePushDequeElement(request: PushDequeElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.pushDequeElementHandler(this.storage, request);
  }

  private async handlePushStackElement(request: PushStackElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.pushStackElementHandler(this.storage, request);
  }

  private async handleInsertListElement(request: InsertListElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.insertListElementHandler(this.storage, request);
  }

  private async handleDeleteListElement(request: DeleteListElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.deleteListElementHandler(this.storage, request);
  }

  private async handlePopDequeElement(request: PopDequeElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.popDequeElementHandler(this.storage, request);
  }

  private async handlePopStackElement(request: PopStackElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.popStackElementHandler(this.storage, request);
  }

  private async handleClearList(request: ClearListRequest): Promise<MCPResponse> {
    return listMemoryHandlers.clearListHandler(this.storage, request);
  }

  private async handleGetListElement(request: GetListElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.getListElementHandler(this.storage, request);
  }

  private async handlePeekDequeElement(request: PeekDequeElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.peekDequeElementHandler(this.storage, request);
  }

  private async handlePeekStackElement(request: PeekStackElementRequest): Promise<MCPResponse> {
    return listMemoryHandlers.peekStackElementHandler(this.storage, request);
  }

  private async handleSearchListElements(request: SearchListElementsRequest): Promise<MCPResponse> {
    return listMemoryHandlers.searchListElementsHandler(this.storage, request);
  }

  /**
   * 启动服务器（stdio模式）
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
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
}
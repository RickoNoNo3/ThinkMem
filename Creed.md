# THINK-MEM Creed - 顶层设计文档

## 项目定位与设计理念

THINK-MEM 是一个为大型语言模型设计的内存管理系统，旨在帮助LLM更好地组织、存储和检索信息。系统提供多种内存类型以适应不同的数据结构需求，并支持两种通信协议以覆盖不同的使用场景。

### 核心设计原则

1. **类型安全优先**: 使用TypeScript严格模式，确保编译时类型检查
2. **模块化架构**: 清晰的关注点分离，便于维护和扩展
3. **双重协议支持**: MCP stdio模式用于AI助手集成，HTTP模式用于Web应用
4. **渐进式复杂度**: 从简单的文本存储到复杂的数据结构，满足不同需求
5. **数据持久化**: 可靠的JSON文件存储，支持备份和恢复
6. **实时通信**: HTTP模式支持StreamableHTTP，提供实时更新

## 系统架构

### 整体架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LLM/AI助手     │    │    Web客户端     │    │   移动应用      │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                     │                     │
         │ MCP stdio           │ HTTP/StreamableHTTP │ HTTP API
         ▼                     ▼                     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ ThinkMemServer  │    │  StreamableHTTPServer  │    │  StreamableHTTPServer  │
│   (MCP协议)      │    │  (HTTP协议)      │    │  (HTTP协议)      │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌─────────────────┐
                    │  Memory Layer   │
                    │ ┌─────┬─────┐   │
                    │ │Raw  │List │   │
                    │ │Mem  │Mem  │   │
                    │ └─────┴─────┘   │
                    └────────┬────────┘
                             │
                    ┌─────────────────┐
                    │ Storage Layer   │
                    │   JsonStorage   │
                    └────────┬────────┘
                             │
                    ┌─────────────────┐
                    │   File System   │
                    │  current.db     │
                    └─────────────────┘
```

### 核心组件设计

#### 1. 服务器层 (Server Layer)
- **ThinkMemServer**: MCP协议实现，stdio通信
- **StreamableHTTPServer**: HTTP协议实现，支持StreamableHTTP
- **协议适配**: 统一的业务逻辑，不同的通信方式

#### 2. 内存管理层 (Memory Layer)
- **RawMemory**: 无结构文本存储，支持摘要管理
- **ListMemory**: 有序列表，支持数组/队列/栈模式
- **GraphMemory**: 图结构存储（规划中，暂未实现）

#### 3. 存储层 (Storage Layer)
- **JsonStorage**: JSON文件持久化
- **并发控制**: proper-lockfile确保文件安全
- **备份恢复**: 数据安全保障机制

#### 4. 工具层 (Utils Layer)
- **TextUtils**: 文本处理工具
- **ErrorHandler**: 统一错误处理
- **NamePathHelper**: 内存路径导航

## 配置系统

### 命令行参数
|参数|简写|类型|默认值|说明|
|:--:|:--:|:--:|:--:|:--:|
|mode|-m|string|stdio|运行模式：stdio或http|
|port|-p|number|13809|HTTP服务器端口|
|db|-d|string|~/.thinkmem/current.db|数据库文件路径|
|sim-mode||string|levenshtein|相似度算法：levenshtein或cosine|
|emb-url||string|OpenAI API URL|Embedding API地址|
|emb-model||string|text-embedding-ada-002|Embedding模型名称|
|emb-key||string|THINK_MEM_EMB_KEY|Embedding API密钥|

### 环境变量
|变量名|必需|说明|
|:--:|:--:|:--:|
|THINK_MEM_EMB_KEY|cosine模式必需|OpenAI API密钥|
|NODE_ENV|否|环境模式：development/production|

## 基本概念
### 存储块（Memory）
一个总的存储空间，分为`Raw`/`List`/`Graph`等多种类型

```ts
// 基础Memory类型
interface Memory {
  name: string;
  type: "raw" | "list" | "graph";
  description: string;
}
```

### 无结构存储块（RawMemory）
包含无结构原始数据（纯文本）的块。可存储若干不同粒度的总结。

```ts
// RawMemory数据结构
interface RawMemory extends Memory {
  type: "raw";
  data: string;
  summaries: MemorySummary[];
  nLines: number;
  nChars: number;
}

interface MemorySummary {
  lineBeg: number;
  lineEnd: number;
  text: string;
}
```

### 线性表存储块（ListMemory）
包含若干RawMemory构成的有序列表，也可当作队列/双端队列/栈使用。

```ts
// ListMemory数据结构
interface ListMemory extends Memory {
  type: "list";
  list: RawMemory[];
  role: "array" | "deque" | "stack";
}
```

### 图存储块（GraphMemory）
提供图结构，可以用来表示知识图谱、网络结构，也可用来表示知识树。

```ts
// GraphMemory数据结构（暂时搁置）
interface GraphMemory extends Memory {
  type: "graph";
  nodes: RawMemory[];
  edges: GraphEdge[];
  roleSettings: {
    role: "tree";
    root: string;
  } | {
    role: "graph";
  };
}

interface GraphEdge extends RawMemory {
  from: string;
  to: string;
  weight: number;
  bidir: boolean;
}
```

### NamePath
用于表示一个存储块的定位。
对于ListMemory和GraphMemory，由于它们只能处于首层，因此NamePath只有一段，即其名称。
而对于RawMemory，NamePath可以有多段，用`<::>`分割。

若父级存储块为列表，特殊索引标记是被支持的，包含：
```
list_name<:index:>
list_name<:TOP:>
list_name<:FRONT:>
list_name<:BACK:>
```

此时分隔符后无需再附上name。

当然，也可以不使用特殊索引标记，而是用name来查询：
```
list_name<::>child_raw_name
```

若父级存储块为图，则必须使用特殊索引标记结合name的固定格式，包含四种：
```
graph_name<:ROOT:> // 仅role=tree时有效
graph_name<:VERTEX:>vertex_raw_name
graph_name<:EDGE:>edge_raw_name
graph_name<:EDGE:>from_raw_name<:TO:>to_raw_name
```

### 功能
由于功能复杂，本MCP服务器所有数据都通过Tools获取和发送，不含直接可读的Resources。

#### Memory
##### `addRawMemory`
添加一个新的RawMemory存储块。

请求：
```ts
interface AddRawMemoryRequest {
  name: string;
  description: string;
  data: string;
}
```

##### `addListMemory`
添加一个新的ListMemory存储块。

请求：
```ts
interface AddListMemoryRequest {
  name: string;
  description: string;
  role: "array" | "deque" | "stack";
}
```

##### `addGraphMemory`
添加一个新的GraphMemory存储块。

请求：
```ts
interface AddGraphMemoryRequest {
  name: string;
  description: string;
  role: "tree" | "graph";
}
```

##### `deleteMemory`
删除一个存储块。

请求：
```ts
interface DeleteMemoryRequest {
  name: string;
}
```

##### `searchMemory`
列出符合筛选条件的所有存储块。

请求：
```ts
interface SearchMemoryRequest {
  query?: {
    pattern?: string;
    type?: "raw" | "list" | "graph";
  };
}
```

响应：
```ts
interface SearchMemoryResponse {
  results: Memory[];
}
```

#### RawMemory

##### `writeRaw`
写入或追加文本内容。

请求：
```ts
interface WriteRawRequest {
  namePath: string;
  data: string;
  isAppend?: boolean;
}
```

##### `replaceRawLines`
替换指定行范围的文本。

请求：
```ts
interface ReplaceRawLinesRequest {
  namePath: string;
  lineBeg: number;
  lineEnd: number;
  pattern: string;
  text: string;
}
```

##### `deleteRawLines`
删除指定行范围的文本。

请求：
```ts
interface DeleteRawLinesRequest {
  namePath: string;
  lineBeg: number;
  lineEnd: number;
}
```

##### `insertRawLines`
在指定行插入文本。

请求：
```ts
interface InsertRawLinesRequest {
  namePath: string;
  lineNo: number;
  text: string;
}
```

##### `summarizeRawLines`
为指定行范围添加摘要。

请求：
```ts
interface SummarizeRawLinesRequest {
  namePath: string;
  lineBeg: number;
  lineEnd: number;
  text: string;
}
```

##### `desummarizeRawLines`
删除指定行范围的摘要。

请求：
```ts
interface DesummarizeRawLinesRequest {
  namePath: string;
  lineBeg: number;
  lineEnd: number;
}
```

##### `readRawLines`
读取RawMemory的内容，支持原始数据读取和智能检索。

请求：
```ts
interface ReadRawLinesRequest {
  namePath: string;
  lineBeg?: number;
  lineEnd?: number;
  summarize?: boolean;
}
```

响应：
```ts
interface ReadRawLinesResponse {
  data?: string;
  summaries?: MemorySummary[];
  happyToSum?: boolean;
}
```

##### `searchRawLines`
搜索包含指定模式的行。

请求：
```ts
interface SearchRawLinesRequest {
  namePath: string;
  pattern: string;
}
```

响应：
```ts
interface SearchRawLinesResponse {
  lines?: Array<{
    lineNo: number;
    text: string;
  }>;
}
```

#### ListMemory

##### `appendListElement`
在列表末尾添加元素。

请求：
```ts
interface AppendListElementRequest {
  name: string;
  child_name: string;
  data: string;
  description: string;
}
```

##### `pushDequeElement`
在双端队列前端或后端添加元素。

请求：
```ts
interface PushDequeElementRequest {
  name: string;
  child_name: string;
  data: string;
  description: string;
  position: "front" | "back";
}
```

##### `pushStackElement`
在栈顶添加元素。

请求：
```ts
interface PushStackElementRequest {
  name: string;
  child_name: string;
  data: string;
  description: string;
}
```

##### `insertListElement`
在指定位置插入元素。

请求：
```ts
interface InsertListElementRequest {
  name: string;
  child_name: string;
  index: number;
  data: string;
  description: string;
}
```

##### `deleteListElement`
删除指定位置的元素。

请求：
```ts
interface DeleteListElementRequest {
  name: string;
  index: number;
}
```

##### `deleteListElementByName`
根据元素名称删除ListMemory中的指定元素。利用ListMemory内部的名称唯一性机制快速定位并删除元素。

请求：
```ts
interface DeleteListElementByNameRequest {
  name: string;
  child_name: string;
}
```

##### `popDequeElement`
从双端队列前端或后端弹出元素。

请求：
```ts
interface PopDequeElementRequest {
  name: string;
  position: "front" | "back";
}
```

##### `popStackElement`
从栈顶弹出元素。

请求：
```ts
interface PopStackElementRequest {
  name: string;
}
```

##### `clearList`
清空列表。

请求：
```ts
interface ClearListRequest {
  name: string;
}
```

##### `getListElement`
获取指定位置的元素。

请求：
```ts
interface GetListElementRequest {
  name: string;
  index: number;
}
```

响应：
```ts
interface GetListElementResponse {
  data?: RawMemory;
}
```

##### `peekDequeElement`
查看双端队列前端或后端的元素。

请求：
```ts
interface PeekDequeElementRequest {
  name: string;
  position: "front" | "back";
}
```

##### `peekStackElement`
查看栈顶元素。

请求：
```ts
interface PeekStackElementRequest {
  name: string;
}
```

##### `searchListElements`
搜索列表中包含指定模式的元素。

请求：
```ts
interface SearchListElementsRequest {
  name: string;
  pattern?: string;
}
```

响应：
```ts
interface SearchListElementsResponse {
  results: Array<{
    index: number;
    data: RawMemory;
  }>;
}
```

#### 统一请求和响应类型

所有操作的请求和响应都遵循统一的接口定义：

##### 基础类型
```ts
// 操作请求类型定义
interface BaseRequest {}

interface BaseResponse {
  success: boolean;
  error?: string;
  data?: any;
}
```

##### 统一请求类型
```ts
type MCPRequest =
  | AddRawMemoryRequest
  | AddListMemoryRequest
  | AddGraphMemoryRequest
  | DeleteMemoryRequest
  | SearchMemoryRequest
  | WriteRawRequest
  | ReplaceRawLinesRequest
  | DeleteRawLinesRequest
  | InsertRawLinesRequest
  | SummarizeRawLinesRequest
  | DesummarizeRawLinesRequest
  | ReadRawLinesRequest
  | SearchRawLinesRequest
  | AppendListElementRequest
  | PushDequeElementRequest
  | PushStackElementRequest
  | InsertListElementRequest
  | DeleteListElementRequest
  | DeleteListElementByNameRequest
  | PopDequeElementRequest
  | PopStackElementRequest
  | ClearListRequest
  | GetListElementRequest
  | PeekDequeElementRequest
  | PeekStackElementRequest
  | SearchListElementsRequest;
```

##### 统一响应类型
```ts
type MCPResponse = BaseResponse & {
  data?:
    | SearchMemoryResponse
    | ReadRawLinesResponse
    | SearchRawLinesResponse
    | GetListElementResponse
    | SearchRawLinesResponse
    | RawMemory
    | any;
};
```

#### GraphMemory

暂时搁置，不要管。


## 典型用例
### 1. 存储原文数据
用户写了一篇小说，这篇小说将必须以原文形式(Raw)存储，且今后可以有不同的扩写版本。

### 2. 利用列表，队列或栈理顺思路
a) 列表可以作为Plan List，保存工作进展
b) JSX代码中存在无法解析的格式问题，高度怀疑是标签嵌套或闭合问题，这时可以使用栈结构(Stack)逐个标签进行存储和弹出，最终判断出错位置和原因。可避免过长上下文带来的混淆和幻觉问题。
c) 用户指定了一个文件，想要查找它引用的所有文件及其引用，这时可以使用队列结构(Deque)或栈结构完成临时记忆，以免跳转次数过多导致过长上下文。

### 3. 基于知识图谱的关系网分析
以例1中的小说为例，其情节、人物关系均可构成知识图谱关系网，以便于LLM厘清文章脉络和结构。



## 统一化成果（2024年更新）🎯

### 已完成的核心统一化工作

按照 `handlers → types → server → unit → markdown` 的优先级顺序，我们成功完成了项目的字面级统一化：

#### ✅ 1. 统一types中的类型定义
- **创建完整Response类型体系**: 新增20+个标准化Response接口，涵盖所有操作
- **改进类型安全性**: 消除`any`类型使用，增强TypeScript类型约束
- **统一Request类型命名**: 清理重复定义，移除空的BaseRequest

#### ✅ 2. 统一handlers实现
- **修复编译错误**: 解决类型不匹配问题，确保构建成功
- **统一Response结构**: 所有handler使用标准化Response类型和metadata
- **统一Metadata使用**: RawMemoryMetadata和ListMemoryMetadata的一致使用
- **统一错误处理**: 89个错误抛出点全部使用标准化错误类型

#### ✅ 3. 统一server中的tool定义
- **标准化Tool Schema**: 修复schema定义问题，确保参数验证正确
- **标准化Tool描述**: 25个tool描述全部统一格式和风格
- **修正类型对应关系**: 确保所有case语句与Request类型正确匹配

#### ✅ 4. 更新unit测试
- **补充缺失的测试文件**: 新增高优先级测试文件
- **统一测试结构**: 创建标准化测试模板和命名规范
- **完善测试覆盖**: 核心功能139个测试全部通过

### 统一化成果统计

| 统一化项目 | 完成状态 | 影响范围 |
|---------|---------|---------|
| 类型系统 | ✅ 100% | 全项目类型安全 |
| 响应结构 | ✅ 100% | 所有API响应 |
| 错误处理 | ✅ 100% | 89个错误点 |
| 工具定义 | ✅ 100% | 25个MCP工具 |
| 测试结构 | ✅ 95% | 标准化模板 |

### 技术债务清理
- **类型安全**: 消除了所有`any`类型使用
- **代码重复**: 移除了重复的Metadata定义
- **命名一致**: 统一了变量、函数和类型命名
- **文档同步**: 代码与文档保持一致

## 实现状态与路线图

### 已完成功能 ✅

#### 核心内存类型
- **RawMemory**: 完整实现，支持行级操作、摘要管理、智能读取
- **ListMemory**: 完整实现，支持数组/队列/栈三种模式，名称唯一性机制
- **存储系统**: JSON文件持久化，支持备份恢复、并发控制

#### 服务器实现
- **MCP Stdio服务器**: 26个工具全部实现，完整错误处理
- **StreamableHTTP服务器**: StreamableHTTP，多客户端支持
- **协议适配**: 统一业务逻辑，不同通信方式

#### 工具和基础设施
- **文本处理**: 行级操作、模式替换、字符统计
- **错误处理**: 自定义错误类型，统一错误格式
- **配置管理**: 命令行参数解析，环境变量支持
- **测试体系**: 标准化测试模板，139个核心测试通过

### 规划中功能 🚧

#### GraphMemory（知识图谱）
- **节点管理**: RawMemory节点创建和连接
- **边关系**: 有向/无向边，权重支持
- **查询算法**: 路径查找、邻接查询
- **角色模式**: 树结构、通用图结构

#### 相似度搜索
- **Levenshtein距离**: 基于编辑距离的文本相似度
- **余弦相似度**: 基于OpenAI Embedding的语义相似度
- **混合算法**: 多种相似度算法组合

### 架构扩展点 🔧

#### 新内存类型
1. 在 `src/memory/` 中实现新内存类
2. 在 `src/types/` 中添加类型定义
3. 在 `src/server/` 中更新MCP处理器

#### 新存储后端
1. 在 `src/storage/` 中创建存储类
2. 实现通用接口
3. 更新配置选项

#### 新通信协议
1. 在 `src/server/` 中添加服务器实现
2. 遵循现有模式
3. 更新CLI选项

## 数据流设计

### MCP Stdio模式流程
```
LLM请求 → stdin → ThinkMemServer → JsonStorage → File System
           ← JSON响应 ← stdout ← 业务逻辑 ← 数据读取
```

### HTTP模式流程
```
StreamableHTTP客户端 → EventSource连接 → StreamableHTTP流 → 实时事件推送
```

### 内存操作流程
```
API请求 → 参数验证 → 内存对象 → 存储操作 → 响应序列化
    ↓         ↓         ↓         ↓         ↓
  错误处理   类型检查   业务逻辑   文件锁     JSON输出
```

## 安全与性能考虑

### 安全设计
- **输入验证**: 严格的类型检查和参数验证
- **文件访问**: 数据库目录隔离，防止路径遍历
- **错误处理**: 结构化错误响应，不暴露敏感信息

### 性能优化
- **文件锁**: proper-lockfile确保并发安全
- **智能读取**: 摘要优先的读取策略
- **连接管理**: HTTP模式的心跳和超时机制

### 扩展性设计
- **插件架构**: 清晰的接口定义
- **配置驱动**: 运行时配置选项
- **模块化**: 松耦合的组件设计

## 测试策略

### 单元测试
- **内存类**: 核心功能完整覆盖
- **工具函数**: 算法正确性验证
- **类型安全**: 接口兼容性测试

### 集成测试
- **API端点**: 完整请求响应周期
- **MCP协议**: 完整工作流测试
- **数据库操作**: 持久化验证

### 边界测试
- **错误条件**: 无效输入、缺失数据
- **边界条件**: 大数据量、并发访问
- **协议违规**: 格式错误请求

## 部署架构

### 开发环境
```bash
npm run dev          # ts-node开发模式
npm test             # 运行测试套件
npm run lint         # 代码检查
```

### 生产环境
```bash
npm run build        # TypeScript编译
npm start            # 生产模式运行
```

### 容器化部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY dist ./dist
CMD ["node", "dist/index.js", "--mode", "http"]
```

>>>--- 以下是旧版辅助参考资料，不包含于本文档中

2.1. addMem, delMem, searchMem: 存储块，由ID唯一标识。每个存储块都有Type（Raw/Deque/Stack/VectorSpace）字段，ID字段，以及description字段

2.2. 对于Raw存储块，data字段支持的方法仅有两个：operate()和query(), 分别由详细参数决定具体行为。
对于operate操作，支持的详细参数有：
- write, append两种简单操作，以及replace(lineBeg, lineEnd, pattern, text), insert(line, text), delete(lineBeg, posBeg, lineEnd, posEnd)三种复杂操作。line均从0计数，且双侧闭合，即包含lineBeg和lineEnd。
- 对于summary，支持的方法有：addSummary(lineBeg, lineEnd, text), delSummary(lineBeg, lineEnd)
- 一旦data中某一line被修改，nLines和nWords都会被更新，包含该line的summary将被自动删除。
对于query操作，支持的详细参数有：
- readData(lineBeg, lineEnd)，最简单的方法，返回lineBeg到lineEnd之间的原始文本
- searchLines()，同样是模糊搜索，返回nSimilars个最有可能包含相关内容的行区间（即`[]{lineBeg, lineEnd, score}`）
- 综合data和summary，有智能读取方法：read(lineBeg, lineEnd)。若有重叠区间的所有summary将所有的行全部覆盖了，则仅返回这些summary，否则将额外返回lineBeg到lineEnd之间的文本。read方法还将返回一个boolean字段`happyToSum`，代表本MCP服务器根据自身的启发式算法判断，是否推荐在该区间中添加新的summary（其实实现上很简单，只要不是全覆盖，且行数超过20，就推荐）。

示例：
查询一个小说中与林黛玉有关的部分，非模糊匹配
请求：
```ts
{
  "action": "query",
  "data": {
    "wantTo": "searchLines",
    "pattern": "林黛玉",
  }
}
```

响应：
```ts
{
  "lines": []{
    "lineBeg": 3,
    "lineEnd": 3,
    "score": 1.0,
  }, {
    "lineBeg": 8,
    "lineEnd": 8,
    "score": 1.0,
  }
}
```

然后，可以再详细阅读一下第3行的内容

请求：
```ts
{
  "action": "query",
  "data": {
    "wantTo": "read",
    "lineBeg": 3,
    "lineEnd": 3,
  }
}
```

响应：
```ts
{
  "data": "这是第3行，这一行描写了林黛玉的样貌.",
  "summaries": [],
  "happyToSum": false,
}



2.3. 对于List存储块，以及Deque和Stack存储块，其本质是Raw构成的List，支持的方法有：
基本列表相关
- append(mem)，其本质是创建RawMemory因此参数类似
- insertAt(idx, mem)
- removeAt(idx)
- searchList，可以启用/不启用模糊搜索，启用返回nSimilars个最有可能包含相关内容的RawMemory及其index，不启用返回精确匹配
- searchListContinue
- clearList
- isEmptyList
- operateAt(idx)，其本质是操作RawMemory因此参数类似
- queryAt(idx)，其本质是查询RawMemory因此参数类似

队列相关
- pushFront(mem)
- pushBack(mem)
- operateFront()
- operateBack()
- queryFront()
- queryBack()
- popFront()
- popBack()

栈相关
- pushTop(mem)
- operateTop()
- queryTop()
- popTop()

3. 所有内容都统一持久化为单一json文件，可通过命令行参数配置保存位置

4. 这个MCP服务器由ts和node维护，应符合最佳实践。

---<<< 参考资料结束

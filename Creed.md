# THINK-MEM 让LLM善用思考，善用记忆

## 命令行参数和环境变量
|参数|说明|
|:--:|:--:|
|mode|`stdio|http`, 默认`stdio`, 切换HTTP/STD模式|
|port|默认`13809`, 切换HTTP模式下的监听端口|
|db|默认`<USERPROFILE>/.thinkmem/current.db`，指定存储位置|

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

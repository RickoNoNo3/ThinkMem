# THINK-MEM 让LLM善用思考，善用记忆

## 命令行参数和环境变量
|参数|说明|
|:--:|:--:|
|mode|`stdin|http`, 默认`stdin`, 切换HTTP/STD模式|
|port|默认`13809`, 切换HTTP模式下的监听端口|
|db|默认`<USERPROFILE>/.thinkmem/current.db`，指定存储位置|
|simMode|`levenshtein`/`cosine`, 默认`levenshtein`，指定检索时的相似度模式|
|embUrl|默认`https://api.openai.com/v1/embeddings`，指定Embedding模型的URL|
|embModel|默认`text-embedding-ada-002`，指定Embedding模型的名称|
|embKey|默认`<THINK_MEM_EMB_KEY>`(从环境变量中获取), 指定Embedding模型的API Key|

## 基本概念
### 存储块（Memory）
一个总的存储空间，分为`Raw`/`List`/`Graph`等多种类型

JSON结构：
```ts
type Memory = {
  "name": string,
  "type": "raw"|"list"|"graph",
  "description": string,
}
```

### 无结构存储块（RawMemory）
包含无结构原始数据（纯文本）的块。可存储若干不同粒度的总结。

JSON结构：
```ts
type RawMemory = {
  Memory,
  "data": string,
  "summaries": []{
    "lineStart": int,
    "lineEnd": int,
    "text": string,
  },
  "nLines": int,
  "nWords": int,
}

### 线性表存储块（ListMemory）
包含若干RawMemory构成的有序列表，也可当作队列/双端队列/栈使用。

JSON结构：
```ts
type ListMemory = {
  Memory,
  "list": []RawMemory,
  "role": "array"|"deque"|"stack",
}
```

### 图存储块（GraphMemory）
提供图结构，可以用来表示知识图谱、网络结构，也可用来表示知识树。

JSON结构：
```ts
type GraphMemory = {
  Memory,
  "nodes": []RawMemory,
  "edges": []GraphEdge,
  "roleSettings": {
    "role": "tree",
    "root": string,
  } | {
    "role": "graph",
  }
}

type GraphEdge = {
  "from": string,
  "to": string,
  "description": string,
  "weight": double,
  "bidir": boolean,
}
```

### 功能
由于功能复杂，本MCP服务器所有数据都通过Tools获取和发送，不含直接可读的Resources。

#### Memory
##### `addMem`
添加一个新的存储块，对于不同类型的存储块，`detail`的内容不同。

请求：
```ts
{
  "action": "addMem",
  "info": {
    "name": string,
    "type": "raw"|"list"|"graph",
    "description": string,
    "detail": {
      "data": string, // 将创建对应文本的RawMemory
    } | {
      "role": "array"|"deque"|"stack", // 将创建空的ListMemory
    } | {
      "role": "tree"|"graph", // 将创建空的GraphMemory
    }
  },
}
```

响应：
```ts
{}
```

##### `delMem`
删除一个存储块。

请求：
```ts
{
  "action": "delMem",
  "info": {
    "name": string,
  }
}
```

响应：
```ts
{}
```

##### `searchMem`
列出符合筛选条件的所有存储块。
如果有字符串筛选条件且容许模糊匹配（nSimilars不为空），则按照模糊匹配相关性排序，否则按照创建时间排序。

请求：
```ts
{
  "action": "searchMem",
  "info": {
    "query": undefined | {
      "name": undefined | string,
      "type": undefined | "raw"|"list"|"graph",
      "description": undefined | string,
      "nSimilars": undefined | int,
    },
    "page": undefined | int,
  }
}

响应：
```ts
{
  "queryId": string,
  "mems": []Memory,
  "page": int,
  "hasNext": boolean,
}
```

##### `searchMemContinue`
继续列出符合筛选条件的所有存储块。

请求：
```ts
{
  "action": "searchMemContinue",
  "info": {
    "queryId": string,
    "page": int,
  },
}
```

响应：
```ts
{
  "queryId": string,
  "mems": []Memory,
  "page": int,
  "hasNext": boolean,
}

#### RawMemory

>>>--- 以下是辅助参考资料，不包含于本文档中

2.1. addMem, delMem, searchMem: 存储块，由ID唯一标识。每个存储块都有Type（Raw/Deque/Stack/VectorSpace）字段，ID字段，以及description字段

2.2. 对于Raw存储块，data字段支持的方法仅有两个：operate()和query(), 分别由详细参数决定具体行为。
对于operate操作，支持的详细参数有：
- write, append两种简单操作，以及replace(lineBeg, lineEnd, pattern, text), insert(line, text), delete(lineBeg, posBeg, lineEnd, posEnd)三种复杂操作。line均从0计数，且双侧闭合，即包含lineBeg和lineEnd。
- 对于summary，支持的方法有：addSummary(lineStart, lineEnd, text), delSummary(lineStart, lineEnd)
- 一旦data中某一line被修改，nLines和nWords都会被更新，包含该line的summary将被自动删除。
对于query操作，支持的详细参数有：
- readData(lineBeg, lineEnd)，最简单的方法，返回lineBeg到lineEnd之间的原始文本
- searchLines()，同样是模糊搜索，返回nSimilars个最有可能包含相关内容的行区间（即`[]{lineBeg, lineEnd, score}`）
- 综合data和summary，有智能读取方法：read(lineStart, lineEnd)。若有重叠区间的所有summary将所有的行全部覆盖了，则仅返回这些summary，否则将额外返回lineStart到lineEnd之间的文本。read方法还将返回一个boolean字段`happyToSum`，代表本MCP服务器根据自身的启发式算法判断，是否推荐在该区间中添加新的summary（其实实现上很简单，只要不是全覆盖，且行数超过20，就推荐）。

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
    "lineStart": 3,
    "lineEnd": 3,
    "score": 1.0,
  }, {
    "lineStart": 8,
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
    "lineStart": 3,
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

## 典型用例
### 1. 存储原文数据
用户写了一篇小说，这篇小说将必须以原文形式(Raw)存储，且今后可以有不同的扩写版本。

### 2. 利用列表，队列或栈理顺思路
a) 列表可以作为Plan List，保存工作进展
b) JSX代码中存在无法解析的格式问题，高度怀疑是标签嵌套或闭合问题，这时可以使用栈结构(Stack)逐个标签进行存储和弹出，最终判断出错位置和原因。可避免过长上下文带来的混淆和幻觉问题。
c) 用户指定了一个文件，想要查找它引用的所有文件及其引用，这时可以使用队列结构(Deque)或栈结构完成临时记忆，以免跳转次数过多导致过长上下文。

### 3. 基于知识图谱的关系网分析
以例1中的小说为例，其情节、人物关系均可构成知识图谱关系网，以便于LLM厘清文章脉络和结构。
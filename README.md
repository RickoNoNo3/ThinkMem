# 🧠 THINK-MEM

AI Memory Management System for LLMs - 让LLM善用思考，善用记忆

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescript-lang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📋 项目简介

THINK-MEM是一个为大型语言模型设计的内存管理系统，提供多种存储类型和通信协议，帮助LLM更好地组织和利用信息。

### ✨ 核心特性

- 🧠 **多种内存类型**: RawMemory（无结构文本）、ListMemory（数组/队列/栈）、GraphMemory（知识图谱）
- 🔍 **智能检索**: Levenshtein/Cosine相似度算法，支持模糊搜索
- 📝 **摘要管理**: 自动摘要生成和管理
- 🔄 **双重模式**: MCP stdio模式 + HTTP/SSE实时模式
- 💾 **持久化存储**: JSON文件存储，支持备份恢复
- 🌐 **Web API**: RESTful API + WebSocket + SSE
- 🧪 **完整测试**: 单元测试 + 集成测试 + 边界测试

## 🚀 快速开始

### 安装依赖
```bash
git clone <repository-url>
cd thinkmem
npm install
npm run build
```

### 基本使用

#### 1. MCP Stdio模式（默认）
```bash
npm start
```

#### 2. HTTP Web API模式
```bash
npm start -- --mode http --port 8080
```

#### 3. 开发模式
```bash
npm run dev
```

## 📖 详细文档

- 📚 [项目架构](./docs/Project-Structure.md) - 完整项目结构和设计说明
- 🚀 [运行模式指南](./docs/Running-Modes.md) - 详细的运行模式和配置说明
- 🌐 [HTTP模式使用](./docs/HTTP-SSE-Usage.md) - Web API和实时通信指南
- 🤖 [Claude助手指南](./CLAUDE.md) - Claude Code集成说明

---

## 🛠️ 使用方法

### 命令行参数

| 参数 | 简写 | 完整参数 | 类型 | 默认值 | 说明 |
|------|------|----------|------|--------|------|
| 模式 | `-m` | `--mode` | string | `stdio` | 运行模式：`stdio`或`http` |
| 端口 | `-p` | `--port` | number | `13809` | HTTP服务器端口 |
| 数据库 | `-d` | `--db` | string | `~/.thinkmem/current.db` | 数据库文件路径 |
| 相似度算法 | | `--sim-mode` | string | `levenshtein` | 相似度算法：`levenshtein`或`cosine` |
| Embedding URL | | `--emb-url` | string | OpenAI API URL | Embedding API地址 |
| Embedding模型 | | `--emb-model` | string | `text-embedding-ada-002` | Embedding模型名称 |
| Embedding密钥 | | `--emb-key` | string | `THINK_MEM_EMB_KEY` | Embedding API密钥 |

### 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `THINK_MEM_EMB_KEY` | cosine模式 | OpenAI API密钥 |
| `NODE_ENV` | 否 | 环境模式（development/production） |

---

## 🏃‍♂️ 运行模式

### 📡 Stdio模式（MCP协议）

**适用于**: AI助手集成、本地开发、MCP生态系统

```bash
# 默认stdio模式
npm start

# 显式指定
npm start -- --mode stdio

# 自定义数据库
npm start -- --db ./my-memory.db

# 开发模式
npm run dev
```

**特点**:
- ✅ 完整MCP协议支持
- ✅ 所有内存操作
- ✅ 简单命令行界面
- ❌ 不支持Web界面
- ❌ 单客户端

### 🌐 HTTP模式（Web API）

**适用于**: Web应用、移动应用、多客户端、实时功能

```bash
# 基础HTTP模式
npm start -- --mode http

# 自定义端口
npm start -- --mode http --port 3000

# 自定义数据库
npm start -- --mode http --db ./data/memory.db

# 使用余弦相似度
npm start -- --mode http --sim-mode cosine

# 完整配置
npm start -- \
  --mode http \
  --port 3000 \
  --db ./data/memory.db \
  --sim-mode cosine
```

**特点**:
- ✅ REST API + 实时事件
- ✅ 多客户端并发
- ✅ Web界面支持
- ✅ 健康检查和统计
- ✅ CORS支持

### 📊 模式对比

| 功能 | Stdio模式 | HTTP模式 |
|------|------------|----------|
| **协议** | MCP stdin/stdout | HTTP/SSE/WebSocket |
| **客户端** | 单个 | 多个并发 |
| **实时性** | 无 | SSE + WebSocket |
| **Web界面** | 无 | 支持 |
| **复杂度** | 简单 | 需要端口配置 |
| **性能** | 低开销 | 高开销 |
| **使用场景** | AI助手 | Web应用 |

---

## 🧠 内存类型和操作

### RawMemory（无结构内存）
- **用途**: 存储文本文档、笔记、日志
- **功能**: 文本操作、摘要管理、智能检索

```json
{
  "action": "addMem",
  "info": {
    "name": "my_document",
    "type": "raw",
    "description": "重要文档",
    "detail": {
      "data": "第一行内容\n第二行内容\n第三行内容"
    }
  }
}
```

### ListMemory（列表内存）
- **用途**: 任务列表、工作流、临时数据
- **功能**: 数组操作、队列、栈管理

```json
{
  "action": "addMem",
  "info": {
    "name": "todo_list",
    "type": "list",
    "description": "任务列表",
    "detail": {
      "role": "array"
    }
  }
}
```

#### 支持的角色类型

1. **Array（数组）**: 基础列表操作
   - `append`: 添加元素
   - `insertAt`: 插入到指定位置
   - `removeAt`: 删除指定位置元素

2. **Deque（双端队列）**: 先进先出/后进先出
   - `pushFront`/`pushBack`: 两端添加
   - `popFront`/`popBack`: 两端移除
   - `queryFront`/`queryBack`: 查询两端

3. **Stack（栈）**: 后进先出
   - `pushTop`: 压入栈顶
   - `popTop`: 弹出栈顶
   - `queryTop`: 查询栈顶

---

## 🌐 Web API使用

### HTTP模式端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/info` | GET | 服务器信息 |
| `/stats` | GET | 统计信息 |
| `/api` | POST | MCP协议API |
| `/sse` | GET | Server-Sent Events |
| `/socket.io` | WebSocket | Socket.IO连接 |

### REST API示例

#### 添加内存
```bash
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addMem",
    "info": {
      "name": "test_memory",
      "type": "raw",
      "description": "测试内存",
      "detail": {
        "data": "测试内容"
      }
    }
  }'
```

#### 查询内存
```bash
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "queryRaw",
    "info": {
      "name": "test_memory",
      "query": {
        "type": "read",
        "lineBeg": 0,
        "queryLineEnd": 0
      }
    }
  }'
```

#### 搜索内存
```bash
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchMem",
    "info": {
      "query": {
        "pattern": "测试",
        "nSimilars": 5
      },
      "page": 0
    }
  }'
```

### SSE实时连接
```javascript
const eventSource = new EventSource('http://localhost:13809/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('实时事件:', data);
};
```

### WebSocket连接
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:13809');

socket.emit('mcp_request', {
  action: 'addMem',
  info: {
    name: 'websocket_test',
    type: 'raw',
    description: 'WebSocket测试',
    detail: { data: '测试内容' }
  }
});

socket.on('mcp_response', (data) => {
  console.log('WebSocket响应:', data);
});
```

---

## 🧪 开发和测试

### 开发命令
```bash
# 安装依赖
npm install

# 开发模式（stdio）
npm run dev

# 编译TypeScript
npm run build

# 运行生产版本
npm start

# 代码检查
npm run lint

# 运行测试
npm test

# 运行特定测试
npm test -- --testNamePattern="RawMemory"
```

### 测试覆盖
- ✅ RawMemory核心功能测试
- ✅ ListMemory操作测试
- ✅ HTTP服务器集成测试
- ✅ 错误处理和边界条件测试
- ✅ CLI命令行测试

### 项目结构
```
thinkmem/
├── src/                    # 源代码
│   ├── types/              # TypeScript类型定义
│   ├── memory/             # 内存管理实现
│   ├── storage/            # 持久化存储
│   ├── server/             # 服务器实现
│   └── utils/              # 工具函数
├── test/                   # 测试文件
├── docs/                   # 文档
├── examples/               # 示例文件
└── dist/                   # 编译输出
```

---

## 📚 更多文档

- 🏗️ [项目架构](./docs/Project-Structure.md) - 完整技术架构说明
- 🚀 [运行模式详解](./docs/Running-Modes.md) - 详细的配置和部署指南
- 🌐 [HTTP模式使用](./docs/HTTP-SSE-Usage.md) - Web API完整文档
- 🤖 [Claude集成](./CLAUDE.md) - Claude Code助手集成说明

---

## 🔧 系统要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **操作系统**: Windows, macOS, Linux
- **内存**: 最少 256MB 可用内存
- **存储**: 至少 50MB 可用磁盘空间

---

## 🚀 生产部署

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 13809
CMD ["node", "dist/index.js", "--mode", "http"]
```

```bash
# 构建镜像
docker build -t thinkmem .

# 运行容器
docker run -p 13809:13809 -v $(pwd)/data:/app/data thinkmem
```

### PM2进程管理
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start "npm start -- --mode http --port 3000" --name thinkmem

# 查看状态
pm2 status

# 查看日志
pm2 logs thinkmem
```

---

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

### 开发规范
- 遵循TypeScript严格模式
- 编写单元测试
- 更新相关文档
- 保持代码风格一致

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - 提供AI助手通信协议
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript
- [Express.js](https://expressjs.com/) - Web应用框架
- [Socket.IO](https://socket.io/) - 实时通信库

---

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看[文档](./docs/)获取详细信息
2. 搜索[Issues](../../issues)查看已知问题
3. 创建新的Issue报告问题
4. 提交Pull Request贡献代码

**🚀 让LLM更好地思考和记忆！**

## 安装和构建

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 开发模式
npm run dev

# 启动服务
npm start
```

## 使用方法

### 作为MCP服务器运行

```bash
# MCP stdio模式（默认）
npm start

# HTTP SSE模式
npm start -- --mode http

# HTTP模式，指定端口
npm start -- --mode http --port 8080

# 指定数据库路径
npm start -- --db /path/to/database.db

# 开发模式运行
npm run dev
```

### 命令行参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--mode` | 运行模式 (`stdio\|http`) | `stdio` |
| `--port` | HTTP端口 | `13809` |
| `--db` | 数据库路径 | `~/.thinkmem/current.db` |
| `--sim-mode` | 相似度算法 (`levenshtein\|cosine`) | `levenshtein` |
| `--emb-url` | Embedding API URL | `https://api.openai.com/v1/embeddings` |
| `--emb-model` | Embedding模型 | `text-embedding-ada-002` |
| `--emb-key` | Embedding API Key | `THINK_MEM_EMB_KEY`环境变量 |

## API 使用示例

### 添加RawMemory

```json
{
  "action": "addMem",
  "info": {
    "name": "my_document",
    "type": "raw",
    "description": "我的文档",
    "detail": {
      "data": "这是第一行\n这是第二行\n这是第三行"
    }
  }
}
```

### 查询RawMemory

```json
{
  "action": "queryRaw",
  "info": {
    "name": "my_document",
    "query": {
      "type": "read",
      "lineBeg": 0,
      "lineEnd": 2
    }
  }
}
```

### 搜索相似内容

```json
{
  "action": "queryRaw",
  "info": {
    "name": "my_document",
    "query": {
      "type": "searchLines",
      "pattern": "第二行",
      "nSimilars": 3
    }
  }
}
```

## 开发

### 项目结构

```
src/
├── types/          # TypeScript类型定义
├── memory/         # 内存管理实现
├── storage/        # 持久化存储
├── server/         # MCP服务器
├── utils/          # 工具函数
└── index.ts        # 入口文件
```

### 代码规范

```bash
# 代码检查
npm run lint

# 运行测试
npm test
```

## 配置

### 环境变量

- `THINK_MEM_EMB_KEY`: OpenAI Embedding API密钥

### 数据库

默认使用JSON文件存储，位置：
- Windows: `%USERPROFILE%\.thinkmem\current.db`
- macOS/Linux: `~/.thinkmem/current.db`

## 开发状态

- [x] RawMemory完整实现
- [x] JSON持久化
- [x] MCP服务器框架
- [x] 相似度搜索
- [x] 基础错误处理
- [x] ListMemory完整实现
- [x] HTTP SSE模式
- [x] WebSocket支持
- [x] REST API接口
- [x] 完整测试覆盖
- [ ] GraphMemory实现
- [ ] Embedding集成

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
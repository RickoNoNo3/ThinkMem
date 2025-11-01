# 🧠 THINK-MEM

AI Memory Management System for LLMs - 让LLM善用思考，善用记忆

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescript-lang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📋 项目简介

THINK-MEM是一个为大型语言模型设计的内存管理系统，提供多种存储类型和通信协议，帮助LLM更好地组织和利用信息。

### ✨ 核心特性

- 🧠 **多种内存类型**: RawMemory（无结构文本）、ListMemory（数组/队列/栈）
- 🔍 **智能检索**: 文本搜索和行级操作
- 📝 **摘要管理**: 自动摘要生成和管理
- 🔄 **双重模式**: MCP stdio模式 + StreamableHTTP模式
- 💾 **持久化存储**: JSON文件存储，支持备份恢复
- 🧪 **完整测试**: 单元测试 + 集成测试

### 基本使用

#### 1. MCP Stdio模式（默认）- 适用于AI助手集成
```bash
npm start
```

#### 2. HTTP Web API模式 - 适用于Web应用
```bash
npm start -- --mode http --port 8080
```

#### 3. 开发模式
```bash
npm run dev
```

## 📖 详细文档

- 🏗️ [顶层设计文档](./creed.md) - 系统架构和设计理念
- 🤖 [Claude助手指南](./CLAUDE.md) - Claude Code集成说明

---

## ⚙️ 配置选项

### 命令行参数

| 参数 | 简写 | 完整参数 | 类型 | 默认值 | 说明 |
|------|------|----------|------|--------|------|
| 模式 | `-m` | `--mode` | string | `stdio` | 运行模式：`stdio`或`http` |
| 端口 | `-p` | `--port` | number | `13809` | HTTP服务器端口 |
| 数据库 | `-d` | `--db` | string | `~/.thinkmem/current.db` | 数据库文件路径 |

### 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `THINK_MEM_EMB_KEY` | cosine模式 | OpenAI API密钥（未来功能） |
| `NODE_ENV` | 否 | 环境模式（development/production） |

---

## 🏃‍♂️ 运行模式

### 📡 Stdio模式

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

### 🌐 HTTP模式（StreamableHTTP）

**适用于**: Web应用、移动应用、多客户端、实时功能

```bash
# 基础HTTP模式
npm start -- --mode http

# 自定义端口
npm start -- --mode http --port 3000

# 自定义数据库
npm start -- --mode http --db ./data/memory.db
```

### 📊 模式对比

| 功能 | Stdio模式 | HTTP模式 |
|------|------------|----------|
| **协议** | MCP stdin/stdout | StreamableHTTP |
| **客户端** | 单个 | 多个并发 |
| **实时性** | 无 | StreamableHTTP |
| **Web界面** | 无 | 支持 |
| **复杂度** | 简单 | 需要端口配置 |
| **性能** | 低开销 | 高开销 |
| **使用场景** | AI助手 | Web应用 |

---

## 🧠 内存类型和操作

### RawMemory（无结构内存）
- **用途**: 存储文本文档、笔记、日志
- **功能**: 行级文本操作、摘要管理、智能搜索
- **特性**: 自动摘要优化、行号索引、内容搜索

**主要操作**:
- 文本写入、追加、插入、删除、替换
- 摘要管理和智能读取
- 基于模式的内容搜索

### ListMemory（列表内存）
- **用途**: 任务列表、工作流、临时数据
- **功能**: 有序集合管理，支持三种角色模式和名称唯一性

#### 🆕 名称唯一性机制（2024年新增）
- 每个元素都有唯一的标识符名称
- 支持按名称快速查找和删除元素
- 自动维护名称映射表，提供O(1)查找性能
- 防止重复名称，确保数据完整性
- 支持嵌套元素的高效管理

#### 支持的角色类型

1. **Array（数组）**: 基础列表操作
   - 添加、插入、删除元素
   - 按索引访问和修改
   - 支持按名称查找和删除

2. **Deque（双端队列）**: 先进先出/后进先出
   - 两端添加和移除元素
   - 队列和栈操作
   - 支持按名称管理元素

3. **Stack（栈）**: 后进先出
   - 压栈、弹栈、栈顶查看
   - LIFO数据管理
   - 支持按名称管理元素

#### 🆕 新增工具（2024年更新）
- **deleteListElementByName**: 根据元素名称删除指定元素
- **getByName**: 快速按名称查找元素（内部方法）
- **nameMap维护**: 自动维护名称到元素的映射关系
- **统一元数据**: 标准化的RawMemory和ListMemory元数据
- **类型安全**: 完整的TypeScript类型支持

### 统一化的元数据（2024年新增）
所有内存操作都返回标准化的元数据：

#### RawMemoryMetadata
```typescript
interface RawMemoryMetadata {
  nLines: number;    // 行数
  nChars: number     // 字符数
}
```

#### ListMemoryMetadata
```typescript
interface ListMemoryMetadata {
  length: number;           // 元素数量
  role: "array" | "deque" | "stack"  // 角色模式
}
```

#### 统一响应格式
```typescript
interface BaseResponse {
  success: boolean;           // 操作是否成功
  data?: {
    message: string;         // 操作消息
    metadata: RawMemoryMetadata | ListMemoryMetadata;
    // 其他响应数据...
  };
  error?: string;             // 错误信息（如有）
}
```

### 标准化响应类型系统（2024年新增）

THINK-MEM现在提供完整的TypeScript类型安全体系，包括20+个标准化响应接口：

```typescript
// 核心响应类型
export interface BaseResponse {
  success: boolean;
  error?: string;
}

export interface StandardResponse<T> extends BaseResponse {
  data: T & {
    message: string;
    metadata: RawMemoryMetadata | ListMemoryMetadata;
  };
}

// 具体操作响应类型
export interface WriteRawResponse extends StandardResponse<{
  operation: 'write' | 'append';
}> { }

export interface SearchMemoryResponse extends StandardResponse<{
  results: Memory[];
}> { }

export interface ReadRawLinesResponse extends StandardResponse<{
  data?: string;
  summaries?: MemorySummary[];
  happyToSum?: boolean;
}> { }

// ... 其他响应类型
```

#### 类型安全特性
- **消除any类型**: 全项目消除`any`类型使用，增强类型约束
- **统一Response结构**: 所有handler使用标准化Response类型和metadata
- **编译时验证**: TypeScript严格模式确保类型安全
- **自动补全**: IDE提供完整的类型提示和错误检查

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
- ✅ 名称唯一性机制测试（2024年新增）
- ✅ 标准化响应类型测试（2024年新增）
- ✅ 统一化接口一致性测试（2024年新增）

### 测试标准化（2024年新增）
- **统一命名规范**: 遵循TEST_NAMING_CONVENTIONS.md标准
- **标准化模板**: 所有测试文件使用统一的describe和test结构
- **完整覆盖**: 139个核心测试用例，覆盖所有主要功能
- **集成测试**: 包含持久化、并发和错误处理的完整测试套件

### 项目结构
```
thinkmem/
├── src/                    # 源代码
│   ├── types/              # TypeScript类型定义（统一化完成）
│   ├── memory/             # 内存管理实现（名称唯一性机制）
│   ├── storage/            # 持久化存储
│   ├── server/             # 服务器实现（25个工具标准化）
│   └── utils/              # 工具函数
├── test/                   # 测试文件（标准化测试结构）
│   └── unit/               # 单元测试（139个测试用例）
│       └── TEST_NAMING_CONVENTIONS.md  # 测试命名规范
├── creed.md               # 顶层设计文档（统一化成果记录）
├── README.md              # 用户手册
├── CLAUDE.md              # Claude集成指南
└── dist/                  # 编译输出
```

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

## 📈 实现状态

### ✅ 已完成
- RawMemory完整实现（行级操作、摘要管理）
- ListMemory完整实现（数组/队列/栈模式）
- **名称唯一性机制**（2024年新增）- O(1)查找性能
- **统一化响应类型系统**（2024年新增）- 20+个标准化接口
- **全局字面级统一**（2024年新增）- handlers→types→server→unit→markdown
- MCP stdio服务器（25个工具全部实现并标准化）
- JSON文件持久化（备份恢复、并发控制）
- 完整测试覆盖（139个测试用例）

### 🚧 规划中
- GraphMemory（知识图谱存储）
- 相似度搜索算法（Levenshtein/Cosine）
- Embedding集成

### 🎯 2024年统一化成果
- **类型系统**: 消除所有`any`类型，增强TypeScript类型约束
- **响应结构**: 统一所有handler的Response结构和metadata使用
- **错误处理**: 89个错误抛出点全部使用标准化错误类型
- **工具定义**: 25个MCP工具schema和描述完全标准化
- **测试体系**: 创建标准化测试模板和命名规范
- **文档同步**: 代码与文档保持完全一致

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

### 开发规范
- 遵循TypeScript严格模式
- 编写单元测试（遵循TEST_NAMING_CONVENTIONS.md）
- 更新相关文档
- 保持代码风格一致
- **统一化要求**: 确保新代码符合全局字面级统一标准
- **类型安全**: 使用标准化的Response类型定义
- **元数据**: 所有操作返回标准化的metadata信息

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - 提供AI助手通信协议
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript
- [Express.js](https://expressjs.com/) - Web应用框架
- [Socket.IO](https://socket.io/) - 实时通信库

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看[设计文档](./creed.md)了解系统架构
2. 查看[Claude集成指南](./CLAUDE.md)了解AI助手使用
3. 搜索Issues查看已知问题
4. 创建新的Issue报告问题

**🚀 让LLM更好地思考和记忆！**
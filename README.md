# 🧠 THINK-MEM

AI Memory Management System for LLMs - 让LLM善用思考，善用记忆

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescript-lang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![Node.js CI](https://github.com/RickoNoNo3/ThinkMem/actions/workflows/node.js.yml/badge.svg)](https://github.com/RickoNoNo3/ThinkMem/actions/workflows/node.js.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📋 项目简介

ThinkMem是一个为大型语言模型设计的记忆管理MCP服务器，提供多种存储类型和通信协议，帮助LLM更好地组织和利用信息。

### ✨ 核心特性

- 🧠 **多种内存类型**: RawMemory（无结构文本）、ListMemory（数组/队列/栈）
- 🔍 **智能检索**: 文本搜索和行级操作
- 📝 **摘要管理**: 自动摘要生成和管理
- 🔄 **双重模式**: MCP stdio模式 + StreamableHTTP模式
- 💾 **持久化存储**: JSON文件存储，支持备份恢复
- 🧪 **完整测试**: 单元测试 + 集成测试

### 基本使用
只推荐两种用法：
1. 单机模式(stdio)，但是为每一个AI助手显式指定存储位置(db参数)
2. 多机模式(HTTP，支持StreamableHTTP)，集中管理多个AI助手的记忆，使用默认存储位置

#### 首先安装
```bash
npm install -g thinkmem
```

#### 用法1：单机模式+显式指定存储位置
命令行用法（仅供调试）：
```bash
npx -g thinkmem --db path/to/db.json # 强烈建议指定db，否则不同进程可能冲突
```

JSON：
```json
{
  "mcpServers": {
    "ThinkMem": {
      "command": "npx",
      "args": ["-g", "thinkmem", "--db", "path/to/db.json"]
    }
  }
}
```

#### 用法2：多机模式
你应该有一个位置能够一定范围内公开部署本项目，最好是公网服务器。当然身为技术人员的你一定知道我在说什么所以我就不多说了。配置SSL等可以通过反向代理。

一、启动服务器：
```bash
npm -g install thinkmem
npx -g thinkmem --mode http --port 13809 # --db 可有可无
```

二、给MCP Host添加AI助手：

JSON：
```json
{
  "mcpServers": {
    "ThinkMem": {
      "type": "streamable-http",
      "url": "http://your.server:13809/mcp"
    }
  }
}
```

Claude Code：
```
claude mcp add --transport http ThinkMem --scope user http://your.server:13809/mcp
```

## 📖 详细文档

- 🏗️ [顶层设计文档](./Creed.md) - 系统架构和设计理念
- 🤖 [Claude助手指南](./CLAUDE.md) - Claude Code集成说明

---

## ⚙️ 配置选项

### 命令行参数

| 参数 | 简写 | 完整参数 | 类型 | 默认值 | 说明 |
|------|------|----------|------|--------|------|
| 模式 | `-m` | `--mode` | string | `stdio` | 运行模式：`stdio`或`http` |
| 端口 | `-p` | `--port` | number | `13809` | HTTP服务器端口 |
| 数据库 | `-d` | `--db` | string | `~/.thinkmem/current.db` | 数据库文件路径 |

---

## 🏃‍♂️ 运行模式

> 下面开始是你clone了repo之后才能做的事，不是npx的用法

### 📡 Stdio模式

**适用于**: AI助手集成、本地开发、MCP生态系统

```bash
# 默认stdio模式
npm start
```

### 🌐 HTTP模式（StreamableHTTP）

**适用于**: Web应用、移动应用、多客户端、实时功能

```bash
# 基础HTTP模式
npm start -- --mode http

# 自定义端口
npm start -- --mode http --port 3000
```

### 📊 模式对比

| 功能 | Stdio模式 | HTTP模式 |
|------|------------|----------|
| **协议** | stdin/stdout | StreamableHTTP |
| **客户端** | 单个 | 多个并发 |
| **复杂度** | 简单 | 需要端口配置 |
| **使用场景** | 测试环境使用 | 生产环境使用 |

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

#### 🆕 名称唯一性机制
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

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - 提供AI助手通信协议
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看[设计文档](./creed.md)了解系统架构
2. 查看[Claude集成指南](./CLAUDE.md)了解AI助手使用
3. 搜索Issues查看已知问题
4. 创建新的Issue报告问题

**🚀 让LLM更好地思考和记忆！**

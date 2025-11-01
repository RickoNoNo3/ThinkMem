#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { ThinkMemServer } from './server/ThinkMemServer';
// import { StreamableHTTPServer } from './server/HttpServer';
import { ConfigError } from './utils/errors';
import { startHTTPServer } from './server/HttpServer';


const program = new Command();

program
  .name('thinkmem')
  .description('THINK-MEM: AI Memory Management System for LLMs')
  .version('1.0.0');

program
  .option('-m, --mode <mode>', 'Operation mode (stdio|http)', 'stdio')
  .option('-p, --port <port>', 'HTTP server port (when mode is http)', '13809')
  .option('-d, --db <path>', 'Database file path', getDefaultDbPath())
  .action(async (options) => {
    try {
      // 验证配置
      validateConfig(options);

      if (options.mode === 'stdio') {
        console.error('THINK-MEM MCP Server running in stdio mode');
        // MCP stdio模式
        const server = new ThinkMemServer(options.db);
        // Graceful shutdown
        process.on('SIGINT', async () => {
          await server.close();
          process.exit(0);
        });
        process.on('SIGTERM', async () => {
          await server.close();
          process.exit(0);
        });
        // Start MCP Server
        await server.run();
      } else if (options.mode === 'http') {
        // StreamableHTTP Server
        const server = new ThinkMemServer(options.db);
        process.on('SIGINT', async () => {
          await server.close();
          process.exit(0);
        });
        process.on('SIGTERM', async () => {
          await server.close();
          process.exit(0);
        });
        startHTTPServer(server, parseInt(options.port));
      } else {
        throw new ConfigError(`Invalid mode: ${options.mode}. Must be 'stdio' or 'http'`);
      }
    } catch (error) {
      process.exit(1);
    }
  });

/**
 * 获取默认数据库路径
 */
function getDefaultDbPath(): string {
  const homeDir = os.homedir();
  const thinkmemDir = path.join(homeDir, '.thinkmem');
  return path.join(thinkmemDir, 'current.db');
}

/**
 * 验证配置
 */
function validateConfig(options: any): void {
  if (!['stdio', 'http'].includes(options.mode)) {
    throw new ConfigError(`Invalid mode: ${options.mode}. Must be 'stdio' or 'http'`);
  }

  if (options.mode === 'http') {
    const port = parseInt(options.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new ConfigError(`Invalid port: ${options.port}. Must be between 1 and 65535`);
    }
  }

  // 修复：为 simMode 设置默认值，如果未定义则使用 'levenshtein'
  if (!options.simMode) {
    options.simMode = 'levenshtein';
  }

  if (!['levenshtein', 'cosine'].includes(options.simMode)) {
    throw new ConfigError(`Invalid simMode: ${options.simMode}. Must be 'levenshtein' or 'cosine'`);
  }

  // 只有在cosine模式下才需要embedding API key
  if (options.simMode === 'cosine' && !options.embKey) {
    console.warn('Warning: Embedding API key is required for cosine similarity mode. Set THINK_MEM_EMB_KEY environment variable or use --emb-key option');
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
});

// 解析命令行参数并运行
program.parse();
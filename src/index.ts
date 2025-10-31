#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import { ThinkMemServer } from './server/ThinkMemServer';
import { HttpSSEServer } from './server/HttpServer';
import { ConfigError } from './utils/errors';

const program = new Command();

program
  .name('thinkmem')
  .description('THINK-MEM: AI Memory Management System for LLMs')
  .version('1.0.0');

program
  .option('-m, --mode <mode>', 'Operation mode (stdio|http)', 'stdio')
  .option('-p, --port <port>', 'HTTP server port (when mode is http)', '13809')
  .option('-d, --db <path>', 'Database file path', getDefaultDbPath())
  .option('--sim-mode <mode>', 'Similarity calculation mode', 'levenshtein')
  .option('--emb-url <url>', 'Embedding API URL', 'https://api.openai.com/v1/embeddings')
  .option('--emb-model <model>', 'Embedding model name', 'text-embedding-ada-002')
  .option('--emb-key <key>', 'Embedding API key', process.env.THINK_MEM_EMB_KEY)
  .action(async (options) => {
    try {
      // 验证配置
      validateConfig(options);

      if (options.mode === 'stdio') {
        // MCP stdio模式
        const server = new ThinkMemServer(options.db);
        await server.run();
      } else if (options.mode === 'http') {
        // HTTP SSE模式
        const port = parseInt(options.port);
        const httpServer = new HttpSSEServer(port, options.db);
        await httpServer.start();

        // 优雅关闭处理
        process.on('SIGINT', async () => {
          console.log('\nShutting down HTTP server...');
          await httpServer.stop();
          process.exit(0);
        });

        process.on('SIGTERM', async () => {
          console.log('\nShutting down HTTP server...');
          await httpServer.stop();
          process.exit(0);
        });
      } else {
        throw new ConfigError(`Invalid mode: ${options.mode}. Must be 'stdio' or 'http'`);
      }
    } catch (error) {
      console.error('Server startup failed:', error);
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
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 优雅关闭（仅用于stdio模式）
process.on('SIGINT', () => {
  if (process.argv.includes('--mode') && process.argv.includes('http')) {
    return; // HTTP模式有自己的关闭处理
  }
  console.error('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (process.argv.includes('--mode') && process.argv.includes('http')) {
    return; // HTTP模式有自己的关闭处理
  }
  console.error('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// 解析命令行参数并运行
program.parse();
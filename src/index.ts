#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { ThinkMemServer } from './server/ThinkMemServer';
// import { StreamableHTTPServer } from './server/HttpServer';
import { ConfigError } from './utils/errors';
import { startHTTPServer } from './server/HttpServer';
import { VERSION } from './version';
import { logger } from './utils/logger';


const program = new Command();

// 添加调试事件监听器
process.on('exit', (code) => {
  console.error('DEBUG: Process exit with code:', code);
});

process.on('beforeExit', (code) => {
  console.error('DEBUG: Process beforeExit with code:', code);
});

// 全局未捕获异常处理
process.on('uncaughtException', (error: Error) => {
  logger.fatal('Uncaught Exception', error);
  console.error('FAULT FROM uncaughtException handler');
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  // 检查是否是业务错误（如 ThinkMemError）
  const isBusinessError = reason &&
    typeof reason === 'object' &&
    (reason.name === 'ThinkMemError' ||
     reason.constructor?.name === 'ThinkMemError' ||
     (reason.code && typeof reason.code === 'string' &&
      ['INVALID_SECRET', 'MEMORY_NOT_FOUND', 'MEMORY_ALREADY_EXISTS', 'INVALID_OPERATION', 'VALIDATION_ERROR', 'MISSING_SECRET'].includes(reason.code)));

  if (isBusinessError) {
    // 业务错误不应该导致服务器关闭，只记录日志
    logger.error('Business error not properly handled:', {
      reason,
      errorCode: reason.code,
      errorMessage: reason.message,
      errorName: reason.name,
      constructorName: reason.constructor?.name
    });
    return;
  }

  // 只有真正的系统级错误才关闭服务器
  logger.error('Unhandled Rejection (System Error):', { promise, reason });

  // 给一点时间让日志输出完成
  setTimeout(() => {
    console.error('FAULT FROM unhandledRejection system error handler');
    process.exit(1);
  }, 100);
});

program
  .name('thinkmem')
  .description('THINK-MEM: AI Memory Management System for LLMs')
  .version(VERSION);

program
  .option('-m, --mode <mode>', 'Operation mode (stdio|http)', 'stdio')
  .option('-p, --port <port>', 'HTTP server port (when mode is http)', '13809')
  .option('-d, --db <path>', 'Database file path', getDefaultDbPath())
  .action(async (options) => {
    try {
      // 验证配置
      validateConfig(options);

      if (options.mode === 'stdio') {
        logger.info('THINK-MEM MCP Server running in stdio mode');
        // MCP stdio模式
        const server = new ThinkMemServer(options.db);
        // Graceful shutdown
        process.on('SIGINT', async () => {
          logger.info('Received SIGINT, shutting down gracefully');
          await server.close();
          process.exit(0);
        });
        process.on('SIGTERM', async () => {
          logger.info('Received SIGTERM, shutting down gracefully');
          await server.close();
          process.exit(0);
        });
        // Start MCP Server
        await server.run();
      } else if (options.mode === 'http') {
        logger.info(`THINK-MEM MCP Server running in HTTP mode on port ${options.port}`);
        // StreamableHTTP Server
        const server = new ThinkMemServer(options.db);
        process.on('SIGINT', async () => {
          logger.info('Received SIGINT, shutting down gracefully');
          await server.close();
          process.exit(0);
        });
        process.on('SIGTERM', async () => {
          logger.info('Received SIGTERM, shutting down gracefully');
          await server.close();
          process.exit(0);
        });
        startHTTPServer(server, parseInt(options.port));
      } else {
        throw new ConfigError(`Invalid mode: ${options.mode}. Must be 'stdio' or 'http'`);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.fatal('Failed to start server', error);
      } else {
        logger.fatal('Failed to start server', String(error));
      }
      console.error('FAULT FROM main action error handler');
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
  console.error('FAULT FROM uncaught exception');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FAULT FROM unhandled rejection');
  console.error(reason);
  process.exit(1);
});

// 解析命令行参数并运行
program.parse();
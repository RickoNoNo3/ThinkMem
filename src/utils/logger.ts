/**
 * 统一的错误日志工具
 * 所有严重性错误都输出到 stderr，避免污染 stdio 通信
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export class Logger {
  private static instance: Logger;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 严重错误 - 必须输出到 stderr
   * 这些错误会影响系统运行，需要立即关注
   */
  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const errorInfo = error instanceof Error ? error.stack || error.message : error;

    if (errorInfo) {
      console.error(`[${timestamp}] ${LogLevel.ERROR}: ${message}\nDetails: ${JSON.stringify(errorInfo, null, 2)}`);
    } else {
      console.error(`[${timestamp}] ${LogLevel.ERROR}: ${message}`);
    }
  }

  /**
   * 警告信息 - 输出到 stderr
   * 潜在问题，可能影响功能
   */
  warn(message: string, details?: any): void {
    const timestamp = new Date().toISOString();

    if (details) {
      console.error(`[${timestamp}] ${LogLevel.WARN}: ${message}\nDetails: ${JSON.stringify(details, null, 2)}`);
    } else {
      console.error(`[${timestamp}] ${LogLevel.WARN}: ${message}`);
    }
  }

  /**
   * 一般信息 - 输出到 stderr
   * 运行状态信息，不会影响功能
   */
  info(message: string): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${LogLevel.INFO}: ${message}`);
  }

  /**
   * 调试信息 - 输出到 stderr
   * 详细调试信息，仅在需要时启用
   */
  debug(message: string, data?: any): void {
    const timestamp = new Date().toISOString();

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      if (data) {
        console.error(`[${timestamp}] ${LogLevel.DEBUG}: ${message}\nData: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.error(`[${timestamp}] ${LogLevel.DEBUG}: ${message}`);
      }
    }
  }

  /**
   * 致命错误 - 输出到 stderr 并准备退出
   * 系统无法继续运行
   */
  fatal(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const errorInfo = error instanceof Error ? error.stack || error.message : error;

    console.error(`\n💀 FATAL ERROR 💀`);
    console.error(`[${timestamp}] ${LogLevel.ERROR}: ${message}`);

    if (errorInfo) {
      console.error(`Details: ${JSON.stringify(errorInfo, null, 2)}`);
    }

    console.error(`Process will exit with code 1\n`);
  }
}

export const logger = Logger.getInstance();
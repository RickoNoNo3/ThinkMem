/**
 * 自定义错误类型
 */

export class ThinkMemError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ThinkMemError';
    this.code = code;
    this.details = details;
  }
}

export class MemoryNotFoundError extends ThinkMemError {
  constructor(name: string) {
    super(`Memory '${name}' not found`, 'MEMORY_NOT_FOUND', { name });
  }
}

export class MemoryAlreadyExistsError extends ThinkMemError {
  constructor(name: string) {
    super(`Memory '${name}' already exists`, 'MEMORY_ALREADY_EXISTS', { name });
  }
}

export class InvalidOperationError extends ThinkMemError {
  constructor(operation: string, reason: string) {
    super(`Invalid operation '${operation}': ${reason}`, 'INVALID_OPERATION', { operation, reason });
  }
}

export class ValidationError extends ThinkMemError {
  constructor(field: string, reason: string) {
    super(`Validation failed for field '${field}': ${reason}`, 'VALIDATION_ERROR', { field, reason });
  }
}

export class StorageError extends ThinkMemError {
  constructor(message: string, originalError?: any) {
    super(`Storage error: ${message}`, 'STORAGE_ERROR', { originalError });
  }
}

export class DatabaseError extends ThinkMemError {
  constructor(message: string, originalError?: any) {
    super(`Database error: ${message}`, 'DATABASE_ERROR', { originalError });
  }
}

export class ConfigError extends ThinkMemError {
  constructor(message: string) {
    super(`Configuration error: ${message}`, 'CONFIG_ERROR');
  }
}
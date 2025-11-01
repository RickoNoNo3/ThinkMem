import * as crypto from 'crypto';
import { JsonStorage } from '../storage/JsonStorage';

/**
 * Secret令牌管理器
 * 负责生成、验证和管理16位访问令牌
 */
export class SecretManager {
  private static readonly SECRET_LENGTH = 16;
  private static readonly EXPIRY_HOURS = 1;
  private static readonly ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  /**
   * 生成16位随机secret令牌
   */
  static generateSecret(): string {
    let secret = '';
    for (let i = 0; i < this.SECRET_LENGTH; i++) {
      const randomIndex = crypto.randomInt(0, this.ALPHABET.length);
      secret += this.ALPHABET[randomIndex];
    }
    return secret;
  }

  /**
   * 验证secret格式（16位字母数字）
   */
  static isValidSecretFormat(secret: string): boolean {
    return /^[A-Za-z0-9]{16}$/.test(secret);
  }

  /**
   * 创建secret记录（包含过期时间）
   */
  static createSecretRecord(): { secret: string; expiresAt: number } {
    const secret = this.generateSecret();
    const expiresAt = Date.now() + (this.EXPIRY_HOURS * 60 * 60 * 1000); // 1小时后过期

    return { secret, expiresAt };
  }

  /**
   * 检查secret是否过期
   */
  static isExpired(expiresAt: number): boolean {
    return Date.now() > expiresAt;
  }

  /**
   * 生成简单的验证哈希（可选的安全增强）
   */
  static createHash(secret: string): string {
    return crypto.createHash('sha256').update(secret + 'thinkmem-salt').digest('hex').substring(0, 16);
  }

  /**
   * 验证secret令牌（格式检查）
   */
  static validateSecret(secret: string): boolean {
    return this.isValidSecretFormat(secret);
  }

  /**
   * 存储secret到JsonStorage
   */
  static async storeSecret(storage: JsonStorage, secret: string): Promise<string> {
    if (!this.isValidSecretFormat(secret)) {
      throw new Error('Invalid secret format');
    }

    const secretId = `secret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + this.EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    await storage.addSecret(secretId, secret, expiresAt);
    return secretId;
  }

  /**
   * 从JsonStorage验证secret
   */
  static async validateStoredSecret(storage: JsonStorage, secret: string): Promise<boolean> {
    if (!this.isValidSecretFormat(secret)) {
      return false;
    }

    // 清理过期的secrets
    await storage.cleanupExpiredSecrets();

    // 查找匹配的secret
    const secrets = storage.listSecrets();
    for (const secretData of secrets) {
      if (secretData.secret === secret) {
        const now = new Date();
        const expiresAt = new Date(secretData.expiresAt);
        return now <= expiresAt;
      }
    }

    return false;
  }

  /**
   * 清理所有过期的secrets
   */
  static async cleanupExpiredSecrets(storage: JsonStorage): Promise<number> {
    return await storage.cleanupExpiredSecrets();
  }
}

/**
 * Secret存储接口
 */
export interface SecretRecord {
  secret: string;
  expiresAt: number;
  createdAt: number;
  hash?: string;
}
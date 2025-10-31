import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { JsonStorage } from '../storage/JsonStorage';
import { ThinkMemServer } from './ThinkMemServer';
import { MCPRequest, MCPResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface SSEConnection {
  id: string;
  response: Response;
  lastPing: number;
}

export class HttpSSEServer {
  private app: Express;
  private server: any;
  private io: SocketIOServer;
  private thinkMemServer: ThinkMemServer;
  private connections: Map<string, SSEConnection> = new Map();
  private port: number;

  constructor(port: number, dbPath: string) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.thinkMemServer = new ThinkMemServer(dbPath);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupPingInterval();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // 获取服务器信息
    this.app.get('/info', (req, res) => {
      res.json({
        name: 'THINK-MEM HTTP SSE Server',
        version: '1.0.0',
        capabilities: [
          'sse',
          'websocket',
          'rest_api',
          'memory_management',
          'raw_memory',
          'list_memory'
        ],
        endpoints: {
          sse: '/sse',
          websocket: '/socket.io',
          rest: '/api',
          health: '/health',
          info: '/info'
        }
      });
    });

    // SSE连接端点
    this.app.get('/sse', this.handleSSEConnection.bind(this));

    // REST API端点
    this.app.post('/api', this.handleRestAPI.bind(this));

    // 获取统计信息
    this.app.get('/stats', (req, res) => {
      try {
        const stats = this.thinkMemServer.getStats();
        res.json({
          ...stats,
          connections: {
            sse: this.connections.size,
            websocket: this.io.engine.clientsCount
          },
          uptime: process.uptime()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get stats',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: ['/sse', '/api', '/health', '/info', '/stats']
      });
    });

    // 错误处理
    this.app.use((error: any, req: Request, res: Response, next: any) => {
      console.error('HTTP Error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Unknown error'
      });
    });
  }

  /**
   * 设置Socket.IO
   */
  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log(`WebSocket client connected: ${socket.id}`);

      socket.on('mcp_request', async (data: MCPRequest) => {
        try {
          // Note: Direct MCP request processing is no longer supported
          // Use individual tool endpoints instead
          socket.emit('mcp_error', {
            id: data,
            error: 'Direct MCP request processing is no longer supported. Use individual tool endpoints instead.',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('mcp_error', {
            id: data,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
      });

      // 发送欢迎消息
      socket.emit('connected', {
        message: 'Connected to THINK-MEM WebSocket server',
        id: socket.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 处理SSE连接
   */
  private handleSSEConnection(req: Request, res: Response): void {
    const clientId = uuidv4();

    // 设置SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    console.log(`SSE client connected: ${clientId}`);

    const connection: SSEConnection = {
      id: clientId,
      response: res,
      lastPing: Date.now()
    };

    this.connections.set(clientId, connection);

    // 发送连接确认
    this.sendSSEMessage(connection, {
      type: 'connected',
      clientId,
      message: 'Connected to THINK-MEM SSE server',
      timestamp: new Date().toISOString()
    });

    // 处理连接断开
    req.on('close', () => {
      console.log(`SSE client disconnected: ${clientId}`);
      this.connections.delete(clientId);
    });

    // 处理错误
    res.on('error', (error) => {
      console.error(`SSE connection error for ${clientId}:`, error);
      this.connections.delete(clientId);
    });

    // 发送初始心跳
    this.sendSSEMessage(connection, {
      type: 'ping',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 处理REST API请求
   */
  private async handleRestAPI(req: Request, res: Response): Promise<void> {
    try {
      // Note: Direct MCP request processing is no longer supported
      // Use individual tool endpoints instead
      res.status(400).json({
        success: false,
        error: 'Direct MCP request processing is no longer supported.',
        message: 'Use individual tool endpoints instead.',
        availableTools: [
          'addRawMemory', 'addListMemory', 'addGraphMemory',
          'deleteMemory', 'searchMemory',
          'writeRaw', 'replaceRawLines', 'deleteRawLines', 'insertRawLines',
          'summarizeRawLines', 'desummarizeRawLines', 'readRawLines', 'searchRawLines',
          'appendListElement', 'pushDequeElement', 'pushStackElement',
          'insertListElement', 'deleteListElement', 'popDequeElement', 'popStackElement',
          'clearList', 'getListElement', 'peekDequeElement', 'peekStackElement', 'searchListElements'
        ]
      });

    } catch (error) {
      console.error('REST API Error:', error);

      const errorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      res.status(500).json(errorResponse);

      // 广播错误到SSE连接
      this.broadcastSSE({
        type: 'mcp_error',
        error: errorResponse,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 发送SSE消息
   */
  private sendSSEMessage(connection: SSEConnection, data: any): void {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      connection.response.write(message);
      connection.lastPing = Date.now();
    } catch (error) {
      console.error(`Failed to send SSE message to ${connection.id}:`, error);
      this.connections.delete(connection.id);
    }
  }

  /**
   * 广播SSE消息到所有连接
   */
  private broadcastSSE(data: any): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const deadConnections: string[] = [];

    this.connections.forEach((connection, id) => {
      try {
        connection.response.write(message);
        connection.lastPing = Date.now();
      } catch (error) {
        deadConnections.push(id);
      }
    });

    // 清理死连接
    deadConnections.forEach(id => {
      this.connections.delete(id);
    });
  }

  /**
   * 设置心跳间隔
   */
  private setupPingInterval(): void {
    setInterval(() => {
      const now = Date.now();
      const deadConnections: string[] = [];

      this.connections.forEach((connection, id) => {
        // 检查连接是否超时（30秒）
        if (now - connection.lastPing > 30000) {
          deadConnections.push(id);
        } else {
          // 发送心跳
          this.sendSSEMessage(connection, {
            type: 'ping',
            timestamp: new Date().toISOString()
          });
        }
      });

      // 清理超时连接
      deadConnections.forEach(id => {
        console.log(`SSE connection timeout: ${id}`);
        this.connections.delete(id);
      });
    }, 15000); // 每15秒检查一次
  }

  /**
   * 广播自定义事件
   */
  public broadcast(event: string, data: any): void {
    const message = {
      type: 'event',
      event,
      data,
      timestamp: new Date().toISOString()
    };

    // 通过SSE广播
    this.broadcastSSE(message);

    // 通过WebSocket广播
    this.io.emit('event', message);
  }

  /**
   * 获取连接统计
   */
  public getConnectionStats(): {
    sse: number;
    websocket: number;
    total: number;
  } {
    const sse = this.connections.size;
    const websocket = this.io.engine.clientsCount;

    return {
      sse,
      websocket,
      total: sse + websocket
    };
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`THINK-MEM HTTP SSE Server running on port ${this.port}`);
        console.log(`SSE endpoint: http://localhost:${this.port}/sse`);
        console.log(`WebSocket endpoint: http://localhost:${this.port}/socket.io`);
        console.log(`REST API endpoint: http://localhost:${this.port}/api`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        resolve();
      });
    });
  }

  /**
   * 停止服务器
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      // 关闭所有SSE连接
      this.connections.forEach((connection) => {
        try {
          connection.response.end();
        } catch (error) {
          // 忽略关闭错误
        }
      });
      this.connections.clear();

      // 关闭WebSocket服务器
      this.io.close();

      // 关闭HTTP服务器
      this.server.close(() => {
        console.log('HTTP SSE Server stopped');
        resolve();
      });
    });
  }

  /**
   * 获取Express实例（用于中间件扩展）
   */
  public getApp(): Express {
    return this.app;
  }

  /**
   * 获取Socket.IO实例（用于事件扩展）
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}
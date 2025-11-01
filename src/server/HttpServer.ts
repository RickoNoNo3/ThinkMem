import { ThinkMemServer } from './ThinkMemServer';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { logger } from '../utils/logger';

export function startHTTPServer(thinkMemServer: ThinkMemServer, port: number): void {
  try {
    logger.info(`Starting HTTP server on port ${port}`);

    // Set up Express and HTTP transport
    const app = express();
    app.use(express.json());

    // 添加全局错误处理中间件
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('HTTP middleware error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip
      });

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    app.post('/mcp', async (req, res) => {
      try {
        logger.debug(`Received MCP request: ${req.method} ${req.url}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        // Create a new transport for each request to prevent request ID collisions
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true
        });

        res.on('close', () => {
          logger.debug('HTTP request closed');
          transport.close();
        });

        await thinkMemServer.connect(transport);
        await transport.handleRequest(req, res, req.body);

        logger.debug('MCP request handled successfully');
      } catch (error) {
        logger.error('Error handling MCP request', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          method: req.method,
          url: req.url,
          ip: req.ip
        });

        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Internal server error'
          });
        }
      }
    });

    // 404 handler
    app.use((req, res) => {
      logger.warn(`404 - Route not found: ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path
      });
    });

    const server = app.listen(port, '0.0.0.0', () => {
      logger.info(`ThinkMem MCP Server running on http://0.0.0.0:${port}/mcp`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.fatal(`Port ${port} is already in use. Please use a different port.`);
      } else if (error.code === 'EACCES') {
        logger.fatal(`Permission denied to bind to port ${port}. Please use a different port or run with elevated privileges.`);
      } else {
        logger.fatal('HTTP server error', error);
      }
      console.error('FAULT FROM HTTP server error handler');
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down HTTP server gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down HTTP server gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.fatal('Failed to start HTTP server', error);
    console.error('FAULT FROM HTTP server startup error handler');
    process.exit(1);
  }
}
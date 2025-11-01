import { ThinkMemServer } from './ThinkMemServer';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

export function startHTTPServer(thinkMemServer: ThinkMemServer, port: number) {
  // Set up Express and HTTP transport
  const app = express();
  app.use(express.json());
  app.post('/mcp', async (req, res) => {
      // Create a new transport for each request to prevent request ID collisions
      const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true
      });

      res.on('close', () => {
          transport.close();
          thinkMemServer.close();
      });

      await thinkMemServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
  });

  app.listen(port, '0.0.0.0', () => {
      console.log(`ThinkMem MCP Server running on http://0.0.0.0:${port}/mcp`);
  }).on('error', error => {
      console.error('Server error:', error);
      process.exit(1);
  });
}
# THINK-MEM Running Modes Guide

## Overview

THINK-MEM supports two primary running modes, each optimized for different use cases:

1. **Stdio Mode** - MCP protocol communication
2. **HTTP Mode** - Web API with real-time features

## 📋 Quick Reference

| Mode | Command | Use Case | Protocol | Port |
|------|---------|----------|----------|------|
| Stdio | `npm start` | AI Assistant Integration | MCP stdin/stdout | N/A |
| HTTP | `npm start -- --mode http` | Web Applications | HTTP/SSE/WebSocket | 13809 |

---

## 🔄 Stdio Mode (MCP Protocol)

### Description
Stdio mode uses the Model Context Protocol (MCP) for direct communication with AI assistants through standard input/output streams.

### When to Use
- **AI Assistant Integration**: Direct integration with Claude, ChatGPT, etc.
- **Local Development**: Simple command-line usage
- **MCP Ecosystem**: Compatibility with MCP tools and frameworks
- **Minimal Overhead**: No HTTP server overhead

### Starting Stdio Mode

```bash
# Default mode (stdio)
npm start

# Explicit stdio mode
npm start -- --mode stdio

# Development mode
npm run dev

# With custom database
npm start -- --db /path/to/database.db
```

### Communication Protocol
- **Input**: JSON objects via stdin
- **Output**: JSON responses via stdout
- **Error**: Error messages via stderr

### Example Workflow
```bash
# Start server
npm start

# Send MCP request (stdin)
{"action": "addMem", "info": {"name": "test", "type": "raw", "description": "Test", "detail": {"data": "content"}}}

# Receive response (stdout)
{"success": true, "data": {"message": "Memory 'test' created successfully"}}
```

### Stdio Mode Features
- ✅ All MCP operations supported
- ✅ RawMemory, ListMemory operations
- ✅ Search and query functions
- ✅ Error handling and validation
- ✅ JSON persistence
- ❌ Real-time events
- ❌ Web interface
- ❌ Multiple concurrent clients

---

## 🌐 HTTP Mode (Web API)

### Description
HTTP mode provides a full-featured web API with real-time communication capabilities through Server-Sent Events and WebSockets.

### When to Use
- **Web Applications**: Browser-based interfaces
- **Mobile Apps**: HTTP API integration
- **Multiple Clients**: Concurrent access support
- **Real-time Features**: Live updates and notifications
- **Microservices**: Service-to-service communication
- **Development Tools**: Testing and debugging interfaces

### Starting HTTP Mode

```bash
# Basic HTTP mode
npm start -- --mode http

# Custom port
npm start -- --mode http --port 8080

# Custom database
npm start -- --mode http --db /path/to/database.db

# With similarity mode
npm start -- --mode http --sim-mode cosine

# Full configuration
npm start -- \
  --mode http \
  --port 3000 \
  --db ./data/memory.db \
  --sim-mode levenshtein
```

### Available Endpoints

#### Core Endpoints
- **Health Check**: `GET /health`
- **Server Info**: `GET /info`
- **Statistics**: `GET /stats`
- **REST API**: `POST /api`
- **SSE Events**: `GET /sse`
- **WebSocket**: `ws://host:port/socket.io`

#### API Documentation
See [HTTP-SSE-Usage.md](./HTTP-SSE-Usage.md) for complete API reference.

### HTTP Mode Features
- ✅ All MCP operations via REST API
- ✅ Real-time events (SSE + WebSocket)
- ✅ Multiple concurrent clients
- ✅ Web interface support
- ✅ CORS enabled for cross-origin requests
- ✅ Connection management and monitoring
- ✅ Health checks and statistics
- ✅ Error handling and logging

---

## ⚙️ Configuration Options

### Command Line Parameters

| Parameter | Short | Long | Type | Default | Description |
|-----------|-------|------|------|---------|-------------|
| Mode | `-m` | `--mode` | string | `stdio` | `stdio` or `http` |
| Port | `-p` | `--port` | number | `13809` | HTTP server port |
| Database | `-d` | `--db` | string | `~/.thinkmem/current.db` | Database file path |
| Similarity | | `--sim-mode` | string | `levenshtein` | `levenshtein` or `cosine` |
| Embedding URL | | `--emb-url` | string | `https://api.openai.com/v1/embeddings` | Embedding API URL |
| Embedding Model | | `--emb-model` | string | `text-embedding-ada-002` | Embedding model name |
| Embedding Key | | `--emb-key` | string | `THINK_MEM_EMB_KEY` | Embedding API key |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `THINK_MEM_EMB_KEY` | Yes (for cosine mode) | OpenAI API key for embeddings |
| `NODE_ENV` | No | Environment mode (`development`, `production`) |

### Database Configuration

#### Default Location
- **Windows**: `%USERPROFILE%\.thinkmem\current.db`
- **macOS/Linux**: `~/.thinkmem/current.db`

#### Custom Database
```bash
# Relative path
npm start -- --db ./data/my-memory.db

# Absolute path
npm start -- --db /usr/local/share/thinkmem/memory.db

# Custom directory
npm start -- --db /path/to/my-directory/memory.db
```

#### Database Creation
- Automatically created if doesn't exist
- Parent directories created as needed
- JSON format with version information

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Package manager

### Installation
```bash
# Clone repository
git clone <repository-url>
cd thinkmem

# Install dependencies
npm install

# Build project
npm run build
```

### Development Commands
```bash
# Development mode (stdio)
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Run specific tests
npm test -- --testNamePattern="RawMemory"

# Code linting
npm run lint
```

### TypeScript Configuration
- **Target**: ES2020
- **Module**: CommonJS
- **Strict**: Enabled
- **Output**: `dist/` directory

---

## 🚀 Production Deployment

### Stdio Mode Production
```bash
# Install production dependencies
npm ci --only=production

# Run in stdio mode
npm start -- --mode stdio
```

### HTTP Mode Production
```bash
# Install production dependencies
npm ci --only=production

# Set environment variables
export NODE_ENV=production
export THINK_MEM_EMB_KEY=your-api-key

# Run HTTP server
npm start -- \
  --mode http \
  --port 3000 \
  --sim-mode cosine
```

### Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start "npm start -- --mode http --port 3000" --name thinkmem

# Using systemd (Linux)
sudo nano /etc/systemd/system/thinkmem.service
# Configure service file
sudo systemctl enable thinkmem
sudo systemctl start thinkmem
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy compiled code
COPY dist ./dist

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 13809

# Set environment
ENV NODE_ENV=production

# Run application
CMD ["node", "dist/index.js", "--mode", "http", "--port", "13809"]
```

```bash
# Build Docker image
docker build -t thinkmem .

# Run container
docker run -p 13809:13809 -v $(pwd)/data:/app/data thinkmem
```

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Error: listen EADDRINUSE :::13809
# Solution: Use different port
npm start -- --mode http --port 8080
```

#### Database Permission Errors
```bash
# Error: EACCES: permission denied
# Solution: Check file permissions or use different directory
npm start -- --db ./temp/memory.db
```

#### Memory Not Found
```bash
# Error: Memory 'xxx' not found
# Solution: Check memory name and create if needed
# Use searchMem to list available memories
```

#### Embedding API Key Issues
```bash
# Warning: Embedding API key required for cosine mode
# Solution: Set environment variable
export THINK_MEM_EMB_KEY=your-openai-api-key
```

### Debug Mode

#### Enable Verbose Logging
```bash
# Set debug environment variable
DEBUG=thinkmem:* npm start -- --mode http
```

#### Check Server Status
```bash
# Health check
curl http://localhost:13809/health

# Server info
curl http://localhost:13809/info

# Statistics
curl http://localhost:13809/stats
```

### Performance Issues

#### Large Databases
- Use appropriate similarity mode (levenshtein for local)
- Consider database cleanup
- Monitor memory usage

#### Concurrent Connections
- HTTP mode supports multiple clients
- Monitor connection count via `/stats`
- Consider connection pooling for high load

---

## 📊 Mode Comparison

| Feature | Stdio Mode | HTTP Mode |
|---------|------------|-----------|
| **Protocol** | MCP stdin/stdout | HTTP/SSE/WebSocket |
| **Clients** | Single client | Multiple concurrent |
| **Real-time** | No | Yes (SSE + WebSocket) |
| **Web Interface** | No | Yes |
| **Setup** | Simple | Requires port configuration |
| **Performance** | Lower overhead | Higher overhead |
| **Use Case** | AI assistants | Web applications |
| **Scalability** | Limited | High |

---

## 🎯 Choosing the Right Mode

### Choose Stdio Mode When:
- Integrating with AI assistants
- Simple command-line usage
- Minimal setup required
- Single client usage
- MCP ecosystem compatibility

### Choose HTTP Mode When:
- Building web applications
- Need real-time features
- Multiple concurrent clients
- Mobile app backend
- Microservices architecture
- Development and testing tools

Both modes provide full access to THINK-MEM's memory management capabilities - the choice depends on your integration requirements and use case.
# THINK-MEM HTTP SSE Server Usage Guide

## Overview

THINK-MEM now supports HTTP mode with Server-Sent Events (SSE) and WebSocket real-time communication, providing a web-based interface for all memory management operations.

## Starting HTTP Server

```bash
# Start HTTP server on default port 13809
npm start -- --mode http

# Start on custom port
npm start -- --mode http --port 8080

# With custom database path
npm start -- --mode http --port 8080 --db /path/to/database.db
```

## Server Endpoints

### Core Endpoints

- **Health Check**: `GET /health`
- **Server Info**: `GET /info`
- **Statistics**: `GET /stats`
- **REST API**: `POST /api`
- **SSE Events**: `GET /sse`
- **WebSocket**: `ws://localhost:13809/socket.io`

### Example Responses

#### Health Check
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T10:52:41.401Z",
  "version": "1.0.0"
}
```

#### Server Info
```json
{
  "name": "THINK-MEM HTTP SSE Server",
  "version": "1.0.0",
  "capabilities": ["sse", "websocket", "rest_api", "memory_management"],
  "endpoints": {
    "sse": "/sse",
    "websocket": "/socket.io",
    "rest": "/api",
    "health": "/health",
    "info": "/info"
  }
}
```

## REST API Usage

### Request Format
```json
{
  "action": "operation_name",
  "info": {
    // operation-specific parameters
  }
}
```

### Response Format
```json
{
  "success": true,
  "request": {
    "action": "operation_name",
    "timestamp": "2025-10-30T10:52:41.401Z"
  },
  "response": {
    // operation response data
  },
  "timestamp": "2025-10-30T10:52:41.401Z"
}
```

## Memory Operations Examples

### Raw Memory Operations

#### Add Raw Memory
```bash
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addMem",
    "info": {
      "name": "my_document",
      "type": "raw",
      "description": "My important document",
      "detail": {
        "data": "First line of content\nSecond line of content\nThird line of content"
      }
    }
  }'
```

#### Query Raw Memory
```bash
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "queryRaw",
    "info": {
      "name": "my_document",
      "query": {
        "type": "read",
        "lineBeg": 0,
        "queryLineEnd": 2
      }
    }
  }'
```

#### Search in Raw Memory
```bash
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "queryRaw",
    "info": {
      "name": "my_document",
      "query": {
        "type": "searchLines",
        "pattern": "content",
        "nSimilars": 3
      }
    }
  }'
```

### List Memory Operations

#### Create List Memory
```bash
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addMem",
    "info": {
      "name": "my_todo_list",
      "type": "list",
      "description": "My task list",
      "detail": {
        "role": "array"
      }
    }
  }'
```

#### Add Item to List
```bash
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "operateList",
    "info": {
      "name": "my_todo_list",
      "operation": {
        "type": "append",
        "mem": {
          "name": "task1",
          "data": "Complete project documentation",
          "description": "Write comprehensive docs"
        }
      }
    }
  }'
```

#### Deque Operations
```bash
# Push to front of deque
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "pushFront",
    "info": {
      "name": "my_deque",
      "mem": {
        "name": "urgent_item",
        "data": "Urgent task content",
        "description": "High priority task"
      }
    }
  }'

# Pop from front of deque
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "popFront",
    "info": {
      "name": "my_deque"
    }
  }'
```

#### Stack Operations
```bash
# Push to stack top
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "pushTop",
    "info": {
      "name": "my_stack",
      "mem": {
        "name": "next_task",
        "data": "Task to work on next",
        "description": "Next priority"
      }
    }
  }'

# Pop from stack top
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "popTop",
    "info": {
      "name": "my_stack"
    }
  }'
```

### Search Memories
```bash
curl -X POST http://localhost:13809/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchMem",
    "info": {
      "query": {
        "pattern": "task",
        "nSimilars": 10
      },
      "page": 0
    }
  }'
```

## Server-Sent Events (SSE)

### Connect to SSE Stream
```javascript
const eventSource = new EventSource('http://localhost:13809/sse');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('SSE Event:', data);
};

eventSource.onerror = function(error) {
  console.error('SSE Error:', error);
};
```

### SSE Event Types
- `connected`: Initial connection confirmation
- `ping`: Heartbeat messages
- `mcp_response`: Responses to API requests
- `mcp_error`: Error notifications
- `event`: Custom events

### Example SSE Message
```json
{
  "type": "mcp_response",
  "action": "addMem",
  "response": {
    "success": true,
    "data": { "message": "Memory created successfully" }
  },
  "timestamp": "2025-10-30T10:52:41.401Z"
}
```

## WebSocket Communication

### Connect with Socket.IO
```html
<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io('http://localhost:13809');

// Send MCP request
socket.emit('mcp_request', {
  action: 'addMem',
  info: {
    name: 'websocket_test',
    type: 'raw',
    description: 'Test via WebSocket',
    detail: { data: 'WebSocket test content' }
  }
});

// Handle response
socket.on('mcp_response', (data) => {
  console.log('WebSocket Response:', data);
});

// Handle errors
socket.on('mcp_error', (data) => {
  console.error('WebSocket Error:', data);
});
</script>
```

## Web Client

A complete HTML client is available at `examples/http-client.html`:

1. Open the file in your web browser
2. Configure server URL (default: http://localhost:13809)
3. Use the template buttons to load common requests
4. Send requests and see responses in real-time
5. Connect via SSE or WebSocket for live updates

## Statistics and Monitoring

### Get Server Statistics
```bash
curl http://localhost:13809/stats
```

### Response Example
```json
{
  "totalMemories": 5,
  "rawMemories": 2,
  "listMemories": 3,
  "graphMemories": 0,
  "version": "1.0.0",
  "connections": {
    "sse": 2,
    "websocket": 1,
    "total": 3
  },
  "uptime": 3600.5
}
```

## Error Handling

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid format)
- `404`: Not Found (unknown endpoint)
- `500`: Internal Server Error (processing error)

### Error Response Format
```json
{
  "success": false,
  "error": "Memory 'test_memory' not found",
  "code": "MEMORY_NOT_FOUND",
  "details": { "name": "test_memory" },
  "timestamp": "2025-10-30T10:52:41.401Z"
}
```

## CORS and Security

The server includes CORS headers for cross-origin requests:
```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Cache-Control, Content-Type
```

For production use, configure appropriate CORS policies and authentication.

## Deployment Considerations

### Environment Variables
- `THINK_MEM_EMB_KEY`: OpenAI API key for embedding operations
- `NODE_ENV`: Set to 'production' for production deployment

### Production Tips
1. Use HTTPS in production
2. Configure appropriate CORS policies
3. Set up proper logging and monitoring
4. Consider rate limiting for API endpoints
5. Use process managers like PM2 for reliability

### Docker Deployment (Future)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 13809
CMD ["node", "dist/index.js", "--mode", "http"]
```

## Integration Examples

### Python Client
```python
import requests

# Add memory
response = requests.post('http://localhost:13809/api', json={
    'action': 'addMem',
    'info': {
        'name': 'python_test',
        'type': 'raw',
        'description': 'Python test',
        'detail': {'data': 'Test from Python client'}
    }
})

print(response.json())
```

### Node.js Client
```javascript
const axios = require('axios');

// Add memory
const response = await axios.post('http://localhost:13809/api', {
  action: 'addMem',
  info: {
    name: 'nodejs_test',
    type: 'raw',
    description: 'Node.js test',
    detail: { data: 'Test from Node.js client' }
  }
});

console.log(response.data);
```

## Troubleshooting

### Common Issues
1. **Port already in use**: Change port with `--port` flag
2. **Database permission errors**: Ensure write access to database directory
3. **CORS issues**: Configure server for your domain in production
4. **Connection timeouts**: Check firewall and network configuration

### Debug Mode
Set `DEBUG=thinkmem:*` environment variable for detailed logging:
```bash
DEBUG=thinkmem:* npm start -- --mode http
```
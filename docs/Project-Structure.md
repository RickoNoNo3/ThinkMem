# THINK-MEM Project Structure

## 📁 Project Overview

THINK-MEM is a TypeScript-based AI memory management system that provides multiple storage types and communication protocols for Large Language Models.

## 📂 Directory Structure

```
thinkmem/
├── 📄 package.json              # Project configuration and dependencies
├── 📄 package-lock.json         # Locked dependency versions
├── 📄 tsconfig.json              # TypeScript configuration
├── 📄 jest.config.js             # Jest test configuration
├── 📄 README.md                  # Main project documentation
├── 📄 CLAUDE.md                  # Claude Code assistant guide
│
├── 📁 src/                       # Source code directory
│   ├── 📄 index.ts               # Main CLI entry point
│   ├── 📁 types/                 # TypeScript type definitions
│   │   └── 📄 index.ts           # All MCP types and interfaces
│   ├── 📁 memory/                # Memory management implementations
│   │   ├── 📄 RawMemory.ts       # Raw memory (unstructured text)
│   │   └── 📄 ListMemory.ts      # List memory (arrays, deques, stacks)
│   ├── 📁 storage/               # Data persistence layer
│   │   └── 📄 JsonStorage.ts      # JSON file-based storage
│   ├── 📁 server/                # Server implementations
│   │   ├── 📄 ThinkMemServer.ts  # MCP protocol server (stdio mode)
│   │   └── 📄 HttpServer.ts       # HTTP/SSE/WebSocket server
│   └── 📁 utils/                 # Utility functions
│       ├── 📄 textUtils.ts        # Text processing utilities
│       ├── 📄 similarityUtils.ts # Similarity calculation algorithms
│       └── 📄 errors.ts           # Custom error classes
│
├── 📁 dist/                      # Compiled JavaScript output
│   └── (generated .js files)      # TypeScript compilation results
│
├── 📁 test/                      # Test files
│   ├── 📄 ListMemory.test.ts      # ListMemory unit tests
│   ├── 📄 RawMemory.test.ts       # RawMemory unit tests
│   ├── 📄 HttpServer.test.ts      # HTTP server unit tests
│   ├── 📄 HttpServer.integration.test.ts # HTTP integration tests
│   ├── 📄 ErrorHandling.test.ts   # Error handling and edge case tests
│   └── 📄 CLI.test.ts             # Command-line interface tests
│
├── 📁 docs/                      # Documentation
│   ├── 📄 Project-Structure.md   # This file
│   ├── 📄 HTTP-SSE-Usage.md       # HTTP mode usage guide
│   └── 📄 API-Reference.md        # Complete API reference (future)
│
├── 📁 examples/                  # Example files and clients
│   ├── 📄 http-client.html        # Web-based HTTP client
│   ├── 📄 listMemory-example.json # ListMemory usage examples
│   └── 📄 curl-examples.sh       # Command-line API examples
│
└── 📁 node_modules/              # Installed dependencies
```

## 🏗️ Architecture Components

### 1. Core Types (`src/types/`)
- **MCPRequest/MCPResponse**: Protocol message types
- **Memory interfaces**: RawMemory, ListMemory, GraphMemory definitions
- **Operation types**: Detailed request/response schemas
- **Error types**: Structured error definitions

### 2. Memory Management (`src/memory/`)
- **RawMemory**: Unstructured text storage with summaries
- **ListMemory**: Ordered collections with role-based operations
  - Array operations (append, insert, remove)
  - Deque operations (push/pop front/back)
  - Stack operations (push/pop top)
- **Future**: GraphMemory for knowledge graphs

### 3. Storage Layer (`src/storage/`)
- **JsonStorage**: File-based persistence
- **Serializable interfaces**: JSON conversion support
- **Database schema**: Versioned data structure
- **Backup/restore**: Data safety features

### 4. Server Implementations (`src/server/`)
- **ThinkMemServer**: MCP stdio protocol server
- **HttpSSEServer**: HTTP server with real-time capabilities
  - REST API endpoints
  - Server-Sent Events (SSE)
  - WebSocket support (Socket.IO)
  - Connection management

### 5. Utilities (`src/utils/`)
- **Text processing**: Line manipulation, word counting
- **Similarity algorithms**: Levenshtein, cosine similarity
- **Error handling**: Custom error hierarchy
- **Validation**: Input validation helpers

## 🔄 Data Flow

### MCP Stdio Mode
```
LLM → stdin → ThinkMemServer → JsonStorage → Response → stdout → LLM
```

### HTTP Mode
```
Client → HTTP Request → HttpSSEServer → ThinkMemServer → JsonStorage
        ← HTTP Response ← SSE/WebSocket Events ←
```

### Memory Operations
```
API Request → Server → Memory Class → Storage → Response → Client
```

## 🧪 Testing Strategy

### Unit Tests
- **Memory classes**: Core functionality testing
- **Utility functions**: Algorithm validation
- **Type safety**: Interface compliance

### Integration Tests
- **HTTP endpoints**: Full request/response cycles
- **MCP protocol**: Complete workflow testing
- **Database operations**: Persistence validation

### Edge Case Tests
- **Error conditions**: Invalid inputs, missing data
- **Boundary conditions**: Large data, concurrent access
- **Protocol violations**: Malformed requests

## 🔧 Development Workflow

### 1. Development Mode
```bash
npm run dev          # Start with ts-node
npm run build        # Compile TypeScript
npm start            # Run compiled version
```

### 2. Testing
```bash
npm test             # Run all tests
npm run test -- --testNamePattern="RawMemory"  # Specific tests
```

### 3. Code Quality
```bash
npm run lint         # TypeScript ESLint
npm run build        # Type checking
```

## 📦 Build Process

### TypeScript Compilation
- Input: `src/**/*.ts`
- Output: `dist/**/*.js`
- Target: ES2020, CommonJS modules
- Strict type checking enabled

### Dependencies Management
- **Runtime**: Express, Socket.IO, Commander, etc.
- **Development**: TypeScript, Jest, ESLint, etc.
- **Type definitions**: @types/* packages

## 🚀 Deployment Options

### 1. Stdio Mode (MCP)
```bash
npm start -- --mode stdio
```
- Uses stdin/stdout for communication
- Compatible with MCP protocol
- Ideal for AI assistant integration

### 2. HTTP Mode (Web API)
```bash
npm start -- --mode http --port 8080
```
- REST API + real-time events
- Web dashboard compatibility
- Multiple client support

### 3. Docker (Future)
```dockerfile
FROM node:18-alpine
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## 🔒 Security Considerations

### Current Implementation
- **Input validation**: Type checking and range validation
- **Error handling**: Structured error responses
- **File access**: Database directory isolation

### Production Recommendations
- **HTTPS**: TLS termination for HTTP mode
- **Authentication**: API keys or OAuth
- **Rate limiting**: Request throttling
- **Input sanitization**: XSS/SQL injection prevention

## 📊 Monitoring and Logging

### Current Features
- **Console logging**: Request/response logging
- **Error tracking**: Detailed error messages
- **Health endpoints**: Service status checking

### Future Enhancements
- **Structured logging**: JSON format logs
- **Metrics collection**: Performance monitoring
- **Health checks**: Database connectivity tests

## 🔧 Configuration Management

### Command Line Parameters
- **Mode selection**: stdio/http
- **Port configuration**: HTTP server port
- **Database path**: Custom storage location
- **Similarity mode**: Algorithm selection
- **Embedding config**: API settings

### Environment Variables
- **THINK_MEM_EMB_KEY**: OpenAI API key
- **NODE_ENV**: Production/development mode

## 📚 Extensibility Points

### 1. Memory Types
- Implement new memory classes in `src/memory/`
- Add type definitions in `src/types/`
- Update MCP handlers in `src/server/`

### 2. Storage Backends
- Create new storage classes in `src/storage/`
- Implement common interface
- Update configuration options

### 3. Communication Protocols
- Add new server implementations in `src/server/`
- Follow existing patterns
- Update CLI options

### 4. Similarity Algorithms
- Add functions in `src/utils/similarityUtils.ts`
- Update type definitions
- Add configuration options

## 🎯 Design Principles

1. **Type Safety**: Comprehensive TypeScript usage
2. **Modularity**: Clear separation of concerns
3. **Extensibility**: Plugin-friendly architecture
4. **Performance**: Efficient algorithms and data structures
5. **Reliability**: Comprehensive error handling
6. **Documentation**: Self-documenting code and examples

## 🔍 Code Quality Standards

### TypeScript
- Strict mode enabled
- Comprehensive type coverage
- Interface segregation
- Generics where appropriate

### Testing
- High test coverage (>90%)
- Unit + integration + E2E tests
- Edge case and error testing
- Performance benchmarks

### Documentation
- Inline code comments
- Type-level documentation
- Usage examples
- API reference

This structure supports both current functionality and future extensibility while maintaining code quality and developer experience.
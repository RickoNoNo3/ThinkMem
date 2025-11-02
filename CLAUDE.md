# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

THINK-MEM is an AI memory management system for LLMs, providing multiple memory types and communication protocols. It's built as an MCP (Model Context Protocol) server with both stdio and HTTP modes.

## Core Architecture

The system provides three types of memory storage for LLMs:

### Memory Types
- **RawMemory**: Unstructured text with summary management and line-level operations
- **ListMemory**: Ordered collections that can function as arrays, deques, or stacks
- **GraphMemory**: Graph/knowledge graph structures (planned but not yet implemented)

### Key Components
- **MCP Server** (`src/server/ThinkMemServer.ts`): Handles stdio protocol communication
- **StreamableHTTP Server** (`src/server/HttpServer.ts`): Web API with real-time events
- **Memory Management** (`src/memory/`): Core memory implementations
- **Storage Layer** (`src/storage/`): JSON file persistence with proper locking
- **Utilities** (`src/utils/`): Text processing and error handling

## Development Commands

### Build and Development
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Development mode (stdio)
npm run dev

# Production start (stdio mode by default)
npm start

# HTTP mode with custom port
npm start -- --mode http --port 8080

# Code linting
npm run lint

# Version synchronization (auto-runs after npm version)
npm run postversion
```

### Testing
```bash
# Run all tests
npm test

# Run specific test pattern
npm test -- --testNamePattern="RawMemory"

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage

# Run tests with CI-like clean install
npm ci && npm test
```

## Key Design Patterns

### Dual Operation Modes
- **Stdio Mode**: MCP protocol over stdin/stdout for AI assistant integration
- **HTTP Mode**: StreamableHTTP for web applications and multi-client support

### Memory Storage Architecture
- Single JSON file persistence with configurable location
- File-based locking mechanism for concurrent access safety
- Line-level operations for RawMemory with automatic summary cleanup
- Role-based ListMemory supporting array, deque, and stack operations

### Similarity Search
- Levenshtein distance for text similarity (default)
- Cosine similarity with OpenAI embeddings (when API key provided)
- Configurable search algorithms and result limits

## Configuration

### Command Line Options
- `--mode`: Operation mode (`stdio`|`http`)
- `--port`: HTTP server port (default: 13809)
- `--db`: Database file path (default: `~/.thinkmem/current.db`)
- `--sim-mode`: Similarity algorithm (`levenshtein`|`cosine`)
- `--emb-url`: Embedding API URL
- `--emb-model`: Embedding model name
- `--emb-key`: Embedding API key (or `THINK_MEM_EMB_KEY` env var)

### Environment Variables
- `THINK_MEM_EMB_KEY`: OpenAI API key for cosine similarity mode
- `NODE_ENV`: Environment mode (development/production)

## File Structure Notes

- **Entry point**: `src/index.ts` - CLI interface with commander.js
- **Version management**: `src/version.ts` - Centralized version (auto-synced from package.json)
- **Type definitions**: `src/types/index.ts` - Core TypeScript interfaces
- **Memory implementations**:
  - `src/memory/RawMemory.ts` - Unstructured text storage with line-level operations
  - `src/memory/ListMemory.ts` - Ordered collections with array/deque/stack roles
- **Storage abstraction**:
  - `src/storage/JsonStorage.ts` - JSON file persistence with locking
  - `src/storage/NamePathHelper.ts` - Memory name path resolution
- **Server implementations**:
  - `src/server/ThinkMemServer.ts` - MCP stdio protocol server
  - `src/server/HttpServer.ts` - StreamableHTTP web server
- **Utilities**:
  - `src/utils/textUtils.ts` - Text processing utilities
  - `src/utils/errors.ts` - Custom error types
  - `src/utils/logger.ts` - Logging utilities
- **Tests**: `test/` - Jest-based test suite with ts-jest and MCP SDK module mapping
- **Scripts**: `scripts/sync-version.js` - Auto-syncs version from package.json to src/version.ts

## Important Implementation Details

- Uses proper-lockfile for safe concurrent file access
- Error handling with custom error types in `src/utils/errors.ts`
- TypeScript strict mode enabled with comprehensive type definitions
- Express.js with CORS support for HTTP mode
- Jest configuration includes module name mapping for MCP SDK
- Node.js CI/CD pipeline tests on Node.js 20.x and 22.x
- Version management automated through npm scripts (postversion hook)
- Global uncaught exception handling for robust error management
- File-based locking with configurable database location (default: `~/.thinkmem/current.db`)
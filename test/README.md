# Test Directory Structure

This directory contains comprehensive tests for the THINK-MEM memory management system.

## Directory Structure

```
test/
├── integration/          # Integration tests
│   ├── stdio.test.ts    # MCP stdio mode integration tests
│   └── http-sse.test.ts # HTTP(SSE) mode integration tests
├── unit/                # Unit tests
│   ├── RawMemory.test.ts   # RawMemory component tests
│   ├── ListMemory.test.ts  # ListMemory component tests
│   └── Storage.test.ts     # Storage layer tests
└── README.md            # This file
```

## Test Categories

### Integration Tests (`integration/`)

These tests verify the end-to-end functionality of the system in different operational modes.

#### stdio.test.ts
- **Purpose**: Tests the MCP (Model Context Protocol) stdio communication mode
- **Coverage**:
  - Basic stdio communication with JSON-RPC protocol
  - MCP message handling (initialize, tools/call, etc.)
  - Memory operations via MCP protocol
  - Error handling for invalid JSON and unknown methods
  - Data persistence across server restarts in stdio mode

#### http-sse.test.ts
- **Purpose**: Tests the HTTP(SSE) server mode with REST API
- **Coverage**:
  - HTTP endpoints (/health, /info, /stats)
  - REST API memory operations (addMem, queryRaw, operateList, etc.)
  - List memory operations (array, deque, stack)
  - Search functionality
  - Error handling for invalid requests and memory not found
  - SSE endpoint connectivity
  - Concurrent request handling

### Unit Tests (`unit/`)

These tests verify individual components in isolation with comprehensive edge case coverage.

#### RawMemory.test.ts
- **Purpose**: Tests the RawMemory class functionality
- **Coverage**:
  - Initialization and basic properties (line count, word count)
  - Write operations (write, append, insert, delete, replace)
  - Summary management (add, delete, overlap prevention)
  - Query operations (read, search, similarity matching)
  - Serialization (toJSON, fromJSON)
  - Edge cases (unicode, special characters, large data)
  - Error handling and data consistency
  - Performance considerations

#### ListMemory.test.ts
- **Purpose**: Tests the ListMemory class functionality
- **Coverage**:
  - Basic array operations (append, insert, remove, clear)
  - Deque operations (pushFront, popFront, pushBack, popBack)
  - Stack operations (pushTop, popTop, queryTop)
  - Search operations (exact match, partial match, similarity scoring)
  - Element operations (operateAt, queryAt, operateByRole)
  - Serialization (toJSON, fromJSON)
  - Role-specific functionality and validation
  - Edge cases (special characters, large data, duplicate names)
  - Performance with large datasets

#### Storage.test.ts
- **Purpose**: Tests the JsonStorage layer for single-process access and persistence
- **Coverage**:
  - **Single Process Locking**:
    - Prevents multiple instances from accessing same database
    - Lock acquisition and release
    - Graceful handling of concurrent access attempts
    - Lock maintenance during operations
  - **Data Persistence**:
    - Immediate persistence of changes
    - Data integrity across restarts
    - Handling of corrupted database files
    - Updates to existing memories
  - **Concurrent Operations**:
    - Thread-safe operations within single process
    - Data integrity during concurrent modifications
  - **Error Handling**:
    - Invalid database paths
    - Large data entries
    - Special characters in memory names
    - Edge cases in file locking
  - **Performance**:
    - Large number of memories
    - Frequent save operations
    - Search and retrieval performance

## Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- test/integration/stdio.test.ts
npm test -- test/integration/http-sse.test.ts
npm test -- test/unit/RawMemory.test.ts
npm test -- test/unit/ListMemory.test.ts
npm test -- test/unit/Storage.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Test Design Principles

1. **Comprehensive Coverage**: Each component is tested with normal operations, edge cases, and error conditions
2. **Integration Focus**: Integration tests verify real-world usage patterns
3. **Error Handling**: Every test includes verification of appropriate error responses
4. **Performance Considerations**: Tests include performance benchmarks for critical operations
5. **Data Integrity**: Special attention to data persistence and consistency
6. **Single Process Guarantee**: Storage tests specifically verify the single-process access pattern

## Key Features Tested

### Memory Management
- RawMemory text operations and summary management
- ListMemory data structures (array, deque, stack)
- Search and similarity matching
- Data serialization and persistence

### Communication Protocols
- MCP stdio protocol with JSON-RPC
- HTTP REST API with SSE support
- Request/response format validation

### Storage Layer
- Single-process file locking
- Immediate data persistence
- Concurrent operation safety
- Database corruption recovery

### Error Handling
- Invalid input validation
- Memory not found scenarios
- Type mismatch errors
- Protocol-level errors
- File system errors

This test suite ensures the THINK-MEM system operates reliably across all its intended use cases while maintaining data integrity and performance.
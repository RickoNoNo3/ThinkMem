# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

THINK-MEM is a conceptual AI memory management system designed as an MCP (Model Context Protocol) server. Currently, this project exists as documentation only - the complete technical specification is defined in `Creed.md`, but no implementation exists yet.

**Current State**: Documentation-only project awaiting implementation
**Planned Technology**: TypeScript/Node.js MCP server with SQLite persistence

## Core Architecture (from Creed.md)

The system provides three types of memory storage for LLMs:

### Memory Types
- **RawMemory**: Unstructured text with summary management and line-level operations
- **ListMemory**: Ordered collections that can function as arrays, deques, or stacks
- **GraphMemory**: Graph/knowledge graph structures (planned but not specified)

### Key Design Principles
- All operations through MCP Tools (no direct Resources)
- Single JSON file persistence (configurable location)
- Embedding-based semantic search (OpenAI API)
- Dual operation modes: HTTP server and stdio-based

## Development Setup

**Current Status**: No build system, dependencies, or development tools are configured yet.

**Expected Setup** (when implementation begins):
```bash
# Anticipated project structure
npm init -y
npm install --save-dev typescript @types/node
npm install <mcp-server-dependencies>
```

## Key Documentation

**Primary Specification**: `Creed.md` contains the complete technical specification including:
- Detailed API definitions with TypeScript interfaces
- Request/response formats for all operations
- Command-line parameter specifications
- Usage examples and typical use cases

This document serves as the authoritative source for implementation requirements.

## Implementation Priorities

When implementing this project, follow this order based on the documentation:

1. **Basic MCP Server Framework**: Set up TypeScript/Node.js structure
2. **RawMemory Operations**: Implement text operations and summary management
3. **ListMemory Operations**: Implement array/deque/stack functionality
4. **Persistence Layer**: JSON file storage with configurable location
5. **Embedding Integration**: OpenAI API for semantic search
6. **Dual Mode Support**: HTTP server and stdio interfaces
7. **GraphMemory**: Complete the graph-based memory system

## API Design Notes

- All operations follow consistent request/response patterns
- Error handling and response formats need to be defined during implementation
- Pagination mechanisms for search operations require careful implementation
- Summary management includes automatic cleanup on line modifications
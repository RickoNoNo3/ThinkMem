# Test Directory Structure

This directory contains comprehensive tests for the THINK-MEM memory management system.

## Directory Structure

```
test/
├── integration/          # Integration tests
│   ├── stdio.test.ts    # MCP stdio mode integration tests
│   └── http-StreamableHTTP.test.ts # HTTP(StreamableHTTP) mode integration tests
├── unit/                # Unit tests
│   ├── RawMemory.test.ts   # RawMemory component tests
│   ├── ListMemory.test.ts  # ListMemory component tests
│   └── Storage.test.ts     # Storage layer tests
└── README.md            # This file
```
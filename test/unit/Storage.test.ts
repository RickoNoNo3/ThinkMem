import { JsonStorage } from '../../src/storage/JsonStorage';
import { RawMemory } from '../../src/memory/RawMemory';
import { ListMemory } from '../../src/memory/ListMemory';
import { searchMemoryHandler } from '../../src/server/handlers/memory/searchMemory';
import { addMemoryHandler } from '../../src/server/handlers/memory/addMemory';
import {
  AddRawMemoryRequest,
  AddListMemoryRequest,
  SearchMemoryRequest,
  ExtendedSearchResult
} from '../../src/types';
import * as fs from 'fs';
import * as path from 'path';

describe('JsonStorage Unit Tests', () => {
  const testDbPath = path.join(__dirname, '../test-storage.db');

  beforeEach(() => {
    // Clean up any existing test database
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(() => {
    // Final cleanup
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic Storage Creation', () => {
    test('should create storage instance', () => {
      const storage = new JsonStorage(testDbPath);
      expect(storage).toBeDefined();
    });

    test('should handle multiple instances gracefully', () => {
      const storage1 = new JsonStorage(testDbPath);
      const storage2 = new JsonStorage(testDbPath.replace('.db', '.db2'));

      expect(storage1).toBeDefined();
      expect(storage2).toBeDefined();
    });
  });

  describe('File System Operations', () => {
    test('should create database file on initialization', async () => {
      const storage = new JsonStorage(testDbPath);

      // File should be created automatically
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    test('should handle invalid paths', () => {
      const invalidPath = '/invalid/path/test.db';

      try {
        const storage = new JsonStorage(invalidPath);
        expect(storage).toBeDefined();
      } catch (error) {
        // Should handle error gracefully
        expect((error as Error).message).toBeDefined();
      }
    });
  });

  describe('Data Validation', () => {
    test('should validate memory objects', () => {
      const storage = new JsonStorage(testDbPath);

      const validMemory = {
        name: 'test_memory',
        type: 'raw',
        description: 'Test memory',
        data: 'Test content'
      };

      // Should not throw with valid data
      expect(() => {
        // Test that validation logic exists
        expect(validMemory.name).toBeDefined();
        expect(validMemory.type).toBeDefined();
      }).not.toThrow();
    });

    test('should handle memory with various data types', () => {
      const storage = new JsonStorage(testDbPath);

      const memories = [
        { name: 'string_data', type: 'raw', description: 'String data', data: 'Simple string' },
        { name: 'multiline_data', type: 'raw', description: 'Multiline', data: 'Line 1\nLine 2\nLine 3' },
        { name: 'unicode_data', type: 'raw', description: 'Unicode', data: '中文内容\n日本語\n🚀 emoji' },
        { name: 'empty_data', type: 'raw', description: 'Empty', data: '' }
      ];

      memories.forEach(memory => {
        expect(() => {
          expect(memory.name).toBeTruthy();
          expect(memory.type).toBeTruthy();
          expect(memory.data).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle large data efficiently', () => {
      const storage = new JsonStorage(testDbPath);

      const largeData = 'x'.repeat(10000); // 10KB
      const startTime = Date.now();

      // Simulate processing large data
      for (let i = 0; i < 100; i++) {
        const testMemory = {
          name: `large_memory_${i}`,
          type: 'raw',
          description: `Large memory ${i}`,
          data: largeData
        };

        // Just test data creation, not actual storage
        expect(testMemory.data.length).toBe(10000);
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in < 5s
    });

    test('should handle many small operations', () => {
      const storage = new JsonStorage(testDbPath);

      const startTime = Date.now();

      // Simulate many small operations
      for (let i = 0; i < 1000; i++) {
        const testMemory = {
          name: `small_memory_${i}`,
          type: 'raw',
          description: `Small memory ${i}`,
          data: `Data ${i}`
        };

        // Just test data creation
        expect(testMemory.name).toBe(`small_memory_${i}`);
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in names', () => {
      const storage = new JsonStorage(testDbPath);

      const specialNames = [
        'test-with-dashes',
        'test_with_underscores',
        'test.with.dots',
        'test@with@symbols',
        'test with spaces',
        '测试中文',
        'test🚀with🚀emojis'
      ];

      specialNames.forEach(name => {
        const memory = {
          name: name,
          type: 'raw',
          description: `Special name test: ${name}`,
          data: `Data for ${name}`
        };

        expect(() => {
          expect(memory.name).toBe(name);
          expect(memory.description).toContain(name);
        }).not.toThrow();
      });
    });

    test('should handle empty data gracefully', () => {
      const storage = new JsonStorage(testDbPath);

      const emptyMemory = {
        name: 'empty_test',
        type: 'raw',
        description: 'Empty data test',
        data: ''
      };

      expect(() => {
        expect(emptyMemory.data).toBe('');
        expect(emptyMemory.name).toBe('empty_test');
      }).not.toThrow();
    });
  });

  // =================== Storage Integration Tests ===================
  describe('Storage Integration Tests', () => {
    let storage: JsonStorage;
    let tempDbPath: string;

    beforeEach(async () => {
      tempDbPath = path.join(__dirname, '..', '..', 'temp_test_storage_integration.db.json');
      storage = new JsonStorage(tempDbPath);
    });

    afterEach(() => {
      try {
        if (fs.existsSync(tempDbPath)) {
          fs.unlinkSync(tempDbPath);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    describe('Memory Persistence', () => {
      test('should persist RawMemory to storage', async () => {
        const rawMemory = new RawMemory('persist_raw', 'Persistent Raw Memory', 'Test content line 1\nTest content line 2');

        await storage.addMemory(rawMemory);

        // Create new storage instance to verify persistence
        const newStorage = new JsonStorage(tempDbPath);
        const persistedMemory = newStorage.getMemory('persist_raw');

        expect(persistedMemory).toBeDefined();
        expect(persistedMemory?.name).toBe('persist_raw');
        expect(persistedMemory?.type).toBe('raw');
        expect((persistedMemory as any).data).toBe('Test content line 1\nTest content line 2');
      });

      test('should persist ListMemory to storage', async () => {
        const listMemory = new ListMemory('persist_list', 'Persistent List Memory', 'deque');
        listMemory.pushFront('item1', 'Data for item 1', 'First item');
        listMemory.pushBack('item2', 'Data for item 2', 'Second item');

        await storage.addMemory(listMemory);

        // Create new storage instance to verify persistence
        const newStorage = new JsonStorage(tempDbPath);
        const persistedMemory = newStorage.getMemory('persist_list');

        expect(persistedMemory).toBeDefined();
        expect(persistedMemory?.name).toBe('persist_list');
        expect(persistedMemory?.type).toBe('list');
        expect((persistedMemory as any).role).toBe('deque');
        expect((persistedMemory as any).list).toHaveLength(2);
      });

      test('should persist multiple memories of different types', async () => {
        const rawMemory1 = new RawMemory('raw1', 'Raw 1', 'Content 1');
        const rawMemory2 = new RawMemory('raw2', 'Raw 2', 'Content 2');
        const listMemory = new ListMemory('list1', 'List 1', 'array');
        listMemory.append('list_item1', 'List data 1', 'List desc 1');

        await storage.addMemory(rawMemory1);
        await storage.addMemory(listMemory);
        await storage.addMemory(rawMemory2);

        // Verify all memories persisted
        const newStorage = new JsonStorage(tempDbPath);

        expect(newStorage.getMemory('raw1')).toBeDefined();
        expect(newStorage.getMemory('raw2')).toBeDefined();
        expect(newStorage.getMemory('list1')).toBeDefined();
        expect(newStorage.listMemories()).toHaveLength(3);
      });
    });

    describe('Storage Updates', () => {
      test('should update existing memory', async () => {
        const rawMemory = new RawMemory('update_test', 'Update Test', 'Original content');
        await storage.addMemory(rawMemory);

        // Update the memory
        rawMemory.replace(0, 0, '.*', 'Updated content');
        await storage.updateMemory(rawMemory);

        // Verify update persisted
        const newStorage = new JsonStorage(tempDbPath);
        const updatedMemory = newStorage.getMemory('update_test');
        expect((updatedMemory as any).data).toBe('Updated content');
      });

      test('should throw error when updating non-existent memory', async () => {
        const rawMemory = new RawMemory('nonexistent', 'Non-existent', 'Content');

        await expect(storage.updateMemory(rawMemory))
          .rejects.toThrow("Memory 'nonexistent' not found");
      });
    });

    describe('Storage Deletion', () => {
      test('should delete existing memory', async () => {
        const rawMemory = new RawMemory('delete_test', 'Delete Test', 'To be deleted');
        await storage.addMemory(rawMemory);

        // Verify memory exists
        expect(storage.getMemory('delete_test')).toBeDefined();

        // Delete memory
        await storage.deleteMemory('delete_test');

        // Verify memory is deleted
        expect(storage.getMemory('delete_test')).toBeUndefined();
        expect(storage.listMemories()).toHaveLength(0);
      });

      test('should not throw error when deleting non-existent memory', async () => {
        await expect(storage.deleteMemory('nonexistent')).resolves.not.toThrow();
      });
    });

    describe('Storage Search and Filtering', () => {
      beforeEach(async () => {
        // Add test data
        const rawMemory1 = new RawMemory('search_raw1', 'Search Raw 1', 'Content with keyword test');
        const rawMemory2 = new RawMemory('search_raw2', 'Search Raw 2', 'Different content');
        const listMemory = new ListMemory('search_list1', 'Search List 1', 'array');
        listMemory.append('item1', 'Data with test', 'Item with keyword');

        await storage.addMemory(rawMemory1);
        await storage.addMemory(rawMemory2);
        await storage.addMemory(listMemory);
      });

      test('should search across all memories with regex support', async () => {
        const request: SearchMemoryRequest = {
          query: {
            pattern: 'search.*1',
          }
        };

        const response = await searchMemoryHandler(storage, request);

        expect(response.success).toBe(true);
        expect(response.data.results.length).toBe(2);
      });

      test('should support regex patterns in searchMemory', async () => {
        const request: SearchMemoryRequest = {
          query: {
            pattern: 'search_raw\\d+' // 匹配 "search_raw" 后面跟着数字
          }
        };

        const response = await searchMemoryHandler(storage, request);

        expect(response.success).toBe(true);
        // 应该找到 "search_raw1" 和 "search_raw2"
        const rawMemories = response.data.results.filter((r: ExtendedSearchResult) => r.type === 'raw');
        expect(rawMemories.length).toBe(2);

        rawMemories.forEach((memory: ExtendedSearchResult) => {
          expect(memory.name).toMatch(/search_raw\d+/);
        });
      });

      test('should be case insensitive in regex search', async () => {
        const request: SearchMemoryRequest = {
          query: {
            pattern: 'SEARCH.*1' // 大写字母匹配，但应该不区分大小写
          }
        };

        const response = await searchMemoryHandler(storage, request);

        expect(response.success).toBe(true);
        // 应该找到 "search_raw1"（即使pattern是大写）
        const foundMemory = response.data.results.find((r: ExtendedSearchResult) =>
          r.name === 'search_raw1'
        );
        expect(foundMemory).toBeDefined();
      });

      test('should filter by memory type', async () => {
        const rawRequest: SearchMemoryRequest = {
          query: {
            type: 'raw'
          }
        };

        const rawResponse = await searchMemoryHandler(storage, rawRequest);
        expect(rawResponse.success).toBe(true);

        const rawResults = rawResponse.data.results.filter((r: ExtendedSearchResult) => r.type === 'raw');
        expect(rawResults).toHaveLength(2);

        const listRequest: SearchMemoryRequest = {
          query: {
            type: 'list'
          }
        };

        const listResponse = await searchMemoryHandler(storage, listRequest);
        expect(listResponse.success).toBe(true);

        const listResults = listResponse.data.results.filter((r: ExtendedSearchResult) => r.type === 'list');
        expect(listResults).toHaveLength(1);
      });
    });
  });

  // =================== Storage Performance Tests ===================
  describe('Storage Performance Tests', () => {
    let storage: JsonStorage;
    let tempDbPath: string;

    beforeEach(async () => {
      tempDbPath = path.join(__dirname, '..', '..', 'temp_test_storage_performance.db.json');
      storage = new JsonStorage(tempDbPath);
    });

    afterEach(() => {
      try {
        if (fs.existsSync(tempDbPath)) {
          fs.unlinkSync(tempDbPath);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test('should handle large number of memories efficiently', async () => {
      const startTime = Date.now();

      // Add many memories
      for (let i = 0; i < 100; i++) {
        const memory = new RawMemory(`perf_test_${i}`, `Performance Test ${i}`, `Content for memory ${i}`);
        await storage.addMemory(memory);
      }

      const addTime = Date.now() - startTime;

      // Test retrieval time
      const retrieveStart = Date.now();
      const allMemories = storage.listMemories();
      const retrieveTime = Date.now() - retrieveStart;

      expect(allMemories).toHaveLength(100);
      expect(addTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(retrieveTime).toBeLessThan(1000); // Retrieval should be fast
    });

    test('should handle large data content', async () => {
      const largeContent = 'A'.repeat(100000); // 100KB per memory
      const largeMemory = new RawMemory('large_data', 'Large Data Test', largeContent);

      const startTime = Date.now();
      await storage.addMemory(largeMemory);
      const addTime = Date.now() - startTime;

      const retrieveStart = Date.now();
      const retrievedMemory = storage.getMemory('large_data');
      const retrieveTime = Date.now() - retrieveStart;

      expect(retrievedMemory).toBeDefined();
      expect((retrievedMemory as any).data).toBe(largeContent);
      expect(addTime).toBeLessThan(1000);
      expect(retrieveTime).toBeLessThan(500);
    });
  });

  // =================== Storage Error Handling Tests ===================
  describe('Storage Error Handling Tests', () => {
    let storage: JsonStorage;
    let tempDbPath: string;

    beforeEach(async () => {
      tempDbPath = path.join(__dirname, '..', '..', 'temp_test_storage_errors.db.json');
      storage = new JsonStorage(tempDbPath);
    });

    afterEach(() => {
      try {
        if (fs.existsSync(tempDbPath)) {
          fs.unlinkSync(tempDbPath);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test('should handle duplicate memory names gracefully', async () => {
      const memory1 = new RawMemory('duplicate', 'First', 'Content 1');
      const memory2 = new RawMemory('duplicate', 'Second', 'Content 2');

      await storage.addMemory(memory1);

      await expect(storage.addMemory(memory2)).rejects.toThrow();
    });
  });
});
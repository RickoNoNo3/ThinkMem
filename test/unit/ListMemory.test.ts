import { ListMemory } from '../../src/memory/ListMemory';
import { NamePathHelper } from '../../src/storage/NamePathHelper';
import { JsonStorage } from '../../src/storage/JsonStorage';
import { addMemoryHandler } from '../../src/server/handlers/memory/addMemory';
import { deleteListElementByNameHandler } from '../../src/server/handlers/listMemory/deleteListElementByName';
import { searchMemoryHandler } from '../../src/server/handlers/memory/searchMemory';
import {
  AddListMemoryRequest,
  SearchMemoryRequest,
  ExtendedSearchResult
} from '../../src/types';
import * as fs from 'fs';
import * as path from 'path';

describe('ListMemory Unit Tests', () => {
  let listMemory: ListMemory;

  beforeEach(() => {
    listMemory = new ListMemory('test_list', 'Test List Memory', 'array');
  });

  describe('Initialization and Basic Properties', () => {
    test('should create empty list memory', () => {
      expect(listMemory.name).toBe('test_list');
      expect(listMemory.description).toBe('Test List Memory');
      expect(listMemory.role).toBe('array');
      expect(listMemory.length).toBe(0);
      expect(listMemory.isEmpty()).toBe(true);
      expect(listMemory.list).toHaveLength(0);
    });

    test('should create list with different roles', () => {
      const dequeMemory = new ListMemory('deque_test', 'Test Deque', 'deque');
      expect(dequeMemory.role).toBe('deque');

      const stackMemory = new ListMemory('stack_test', 'Test Stack', 'stack');
      expect(stackMemory.role).toBe('stack');
    });

    test('should handle invalid role gracefully', () => {
      try {
        const invalidMemory = new ListMemory('invalid', 'Invalid role', 'invalid_role' as any);
        // Should either work or throw an error
        expect(invalidMemory.role).toBe('invalid_role');
      } catch (error) {
        expect((error as Error).message).toContain('Invalid role');
      }
    });
  });

  describe('Basic Array Operations', () => {
    test('should append elements', () => {
      listMemory.append('item1', 'Data for item 1', 'First item');
      listMemory.append('item2', 'Data for item 2', 'Second item');

      expect(listMemory.length).toBe(2);
      expect(listMemory.isEmpty()).toBe(false);

      const item1 = listMemory.getAt(0);
      expect(item1?.name).toBe('item1');
      expect(item1?.data).toBe('Data for item 1');
      expect(item1?.description).toBe('First item');

      const item2 = listMemory.getAt(1);
      expect(item2?.name).toBe('item2');
      expect(item2?.data).toBe('Data for item 2');
      expect(item2?.description).toBe('Second item');
    });

    test('should insert elements at specific position', () => {
      listMemory.append('item1', 'Data 1');
      listMemory.append('item3', 'Data 3');
      listMemory.insertAt(1, 'item2', 'Data 2');

      expect(listMemory.length).toBe(3);
      expect(listMemory.getAt(0)?.name).toBe('item1');
      expect(listMemory.getAt(1)?.name).toBe('item2');
      expect(listMemory.getAt(2)?.name).toBe('item3');
    });

    test('should insert at beginning', () => {
      listMemory.append('item2', 'Data 2');
      listMemory.append('item3', 'Data 3');
      listMemory.insertAt(0, 'item1', 'Data 1');

      expect(listMemory.getAt(0)?.name).toBe('item1');
      expect(listMemory.getAt(1)?.name).toBe('item2');
      expect(listMemory.getAt(2)?.name).toBe('item3');
    });

    test('should insert at end', () => {
      listMemory.append('item1', 'Data 1');
      listMemory.append('item2', 'Data 2');
      listMemory.insertAt(2, 'item3', 'Data 3');

      expect(listMemory.length).toBe(3);
      expect(listMemory.getAt(2)?.name).toBe('item3');
    });

    test('should remove elements at specific position', () => {
      listMemory.append('item1', 'Data 1');
      listMemory.append('item2', 'Data 2');
      listMemory.append('item3', 'Data 3');

      const removed = listMemory.removeAt(1);
      expect(removed.name).toBe('item2');
      expect(removed.data).toBe('Data 2');
      expect(listMemory.length).toBe(2);
      expect(listMemory.getAt(0)?.name).toBe('item1');
      expect(listMemory.getAt(1)?.name).toBe('item3');
    });

    test('should clear all elements', () => {
      listMemory.append('item1', 'Data 1');
      listMemory.append('item2', 'Data 2');
      listMemory.append('item3', 'Data 3');

      listMemory.clear();
      expect(listMemory.length).toBe(0);
      expect(listMemory.isEmpty()).toBe(true);
      expect(listMemory.list).toHaveLength(0);
    });

    test('should handle edge cases for position operations', () => {
      // Insert at invalid positions
      listMemory.append('item1', 'Data 1');

      // These should throw because index is out of bounds
      expect(() => listMemory.insertAt(-1, 'invalid', 'invalid data')).toThrow();
      expect(() => listMemory.insertAt(10, 'invalid', 'invalid data')).toThrow();

      // Get at invalid positions
      expect(listMemory.getAt(-1)).toBeUndefined();
      expect(listMemory.getAt(10)).toBeUndefined();

      // Remove at invalid positions
      expect(() => listMemory.removeAt(-1)).toThrow('out of bounds');
      expect(() => listMemory.removeAt(10)).toThrow('out of bounds');
    });
  });

  describe('Deque Operations', () => {
    beforeEach(() => {
      listMemory = new ListMemory('deque_test', 'Test Deque', 'deque');
    });

    test('should push and pop from front', () => {
      listMemory.pushBack('item1', 'Data 1', 'First item');
      listMemory.pushBack('item2', 'Data 2', 'Second item');

      const popped = listMemory.popFront();
      expect(popped.name).toBe('item1');
      expect(popped.data).toBe('Data 1');
      expect(popped.description).toBe('First item');
      expect(listMemory.length).toBe(1);

      const popped2 = listMemory.popFront();
      expect(popped2.name).toBe('item2');
      expect(listMemory.length).toBe(0);
    });

    test('should push and pop from back', () => {
      listMemory.pushFront('item1', 'Data 1', 'First item');
      listMemory.pushFront('item2', 'Data 2', 'Second item');

      const popped = listMemory.popBack();
      expect(popped.name).toBe('item1');
      expect(popped.data).toBe('Data 1');
      expect(listMemory.length).toBe(1);

      const popped2 = listMemory.popBack();
      expect(popped2.name).toBe('item2');
      expect(listMemory.length).toBe(0);
    });

    test('should query front and back without removing', () => {
      listMemory.pushBack('item1', 'Data 1', 'First item');
      listMemory.pushBack('item2', 'Data 2', 'Second item');

      const front = listMemory.peekFront();
      const back = listMemory.peekBack();

      expect(front?.name).toBe('item1');
      expect(front?.data).toBe('Data 1');
      expect(back?.name).toBe('item2');
      expect(back?.data).toBe('Data 2');
      expect(listMemory.length).toBe(2); // Should not change
    });

    test('should handle empty deque operations', () => {
      // Operations on empty deque should return undefined or throw appropriate errors
      expect(listMemory.peekFront()).toBeUndefined();
      expect(listMemory.peekBack()).toBeUndefined();

      try {
        const popped = listMemory.popFront();
        expect(popped).toBeUndefined();
      } catch (error) {
        expect((error as Error).message).toContain('empty');
      }

      try {
        const popped = listMemory.popBack();
        expect(popped).toBeUndefined();
      } catch (error) {
        expect((error as Error).message).toContain('empty');
      }
    });

    test('should handle mixed front/back operations', () => {
      listMemory.pushBack('back1', 'Back Data 1');
      listMemory.pushFront('front1', 'Front Data 1');
      listMemory.pushBack('back2', 'Back Data 2');
      listMemory.pushFront('front2', 'Front Data 2');

      // Expected order: front2, front1, back1, back2
      expect(listMemory.peekFront()?.name).toBe('front2');
      expect(listMemory.peekBack()?.name).toBe('back2');

      const front = listMemory.popFront();
      expect(front.name).toBe('front2');
      expect(listMemory.length).toBe(3);

      const back = listMemory.popBack();
      expect(back.name).toBe('back2');
      expect(listMemory.length).toBe(2);
    });

    test('should throw error for deque operations on non-deque list', () => {
      const arrayList = new ListMemory('array_test', 'Test Array', 'array');

      expect(() => arrayList.pushFront('item', 'data')).toThrow();
      expect(() => arrayList.popFront()).toThrow();
      expect(() => arrayList.pushBack('item', 'data')).toThrow();
      expect(() => arrayList.popBack()).toThrow();
      expect(() => arrayList.peekFront()).toThrow();
      expect(() => arrayList.peekBack()).toThrow();
    });
  });

  describe('Stack Operations', () => {
    beforeEach(() => {
      listMemory = new ListMemory('stack_test', 'Test Stack', 'stack');
    });

    test('should push and pop from top', () => {
      listMemory.pushTop('item1', 'Data 1', 'First item');
      listMemory.pushTop('item2', 'Data 2', 'Second item');

      const popped = listMemory.popTop();
      expect(popped.name).toBe('item2');
      expect(popped.data).toBe('Data 2');
      expect(listMemory.length).toBe(1);

      const popped2 = listMemory.popTop();
      expect(popped2.name).toBe('item1');
      expect(listMemory.length).toBe(0);
    });

    test('should query top without removing', () => {
      listMemory.pushTop('item1', 'Data 1', 'First item');
      listMemory.pushTop('item2', 'Data 2', 'Second item');

      const top = listMemory.peekTop();
      expect(top?.name).toBe('item2');
      expect(top?.data).toBe('Data 2');
      expect(listMemory.length).toBe(2); // Should not change
    });

    test('should handle LIFO behavior correctly', () => {
      listMemory.pushTop('first', 'First data');
      listMemory.pushTop('second', 'Second data');
      listMemory.pushTop('third', 'Third data');

      expect(listMemory.popTop().name).toBe('third');
      expect(listMemory.popTop().name).toBe('second');
      expect(listMemory.popTop().name).toBe('first');
      expect(listMemory.length).toBe(0);
    });

    test('should handle empty stack operations', () => {
      expect(listMemory.peekTop()).toBeUndefined();

      try {
        const popped = listMemory.popTop();
        expect(popped).toBeUndefined();
      } catch (error) {
        expect((error as Error).message).toContain('empty');
      }
    });

    test('should throw error for stack operations on non-stack list', () => {
      const arraylist = new ListMemory('array_test', 'Test Array', 'array');

      expect(() => arraylist.pushTop('item', 'data')).toThrow();
      expect(() => arraylist.popTop()).toThrow();
      expect(() => arraylist.peekTop()).toThrow();
    });
  });

  describe('Search Operations', () => {
    beforeEach(() => {
      listMemory.append('apple', 'Apple data content', 'Red fruit');
      listMemory.append('banana', 'Banana data content', 'Yellow fruit');
      listMemory.append('carrot', 'Carrot data content', 'Orange vegetable');
      listMemory.append('apple_pie', 'Pie with apples', 'DeStreamableHTTPrt');
    });

    test('should find exact matches', () => {
      const results = listMemory.search('apple');
      expect(results.length).toBeGreaterThan(0);

      const appleResult = results.find(r => r.data.name === 'apple');
      expect(appleResult).toBeDefined();
      expect(appleResult!.data.name).toBe('apple');
      expect(appleResult!.data.description).toBe('Red fruit');
    });

    test('should find partial matches', () => {
      const results = listMemory.search('a');
      expect(results.length).toBeGreaterThan(1);

      // Should find both apple and banana
      const fruitNames = results.map(r => r.data.name);
      expect(fruitNames).toContain('apple');
      expect(fruitNames).toContain('banana');
    });

    test('should search across name, description, and data', () => {
      // Search in data
      const dataResults = listMemory.search('apple');
      expect(dataResults.length).toBe(2); // Should find apple, apple_pie

      // Search in description
      const descResults = listMemory.search('Red');
      expect(descResults.length).toBeGreaterThan(0);
      expect(descResults[0].data.name).toBe('apple'); // Apple should have highest similarity score
    });

    test('should return search results', () => {
      const results = listMemory.search('fruit');
      expect(results.length).toBe(2); // Should find all elements containing 'fruit' in names or descriptions
    });

    test('should return all elements when no pattern provided', () => {
      const results = listMemory.search();
      expect(results).toHaveLength(4);
    });

    test('should handle search with no exact matches', () => {
      const results = listMemory.search('nonexistent');
      // Search returns exact matches, so should return 0 results for non-existent pattern
      expect(results.length).toBe(0);
    });

    test('should handle search in empty list', () => {
      const emptyList = new ListMemory('empty', 'Empty', 'array');
      const results = emptyList.search('anything');
      expect(results).toHaveLength(0);
    });

    test('should return all matching results', () => {
      const results = listMemory.search('apple');

      results.forEach(result => {
        expect(result).toHaveProperty('index');
        expect(result).toHaveProperty('data');
        expect(result.data.name).toBe(result.index === 0 ? 'apple' : 'apple_pie');
      });
    });
  });

  describe('Name Uniqueness and NameMap Tests', () => {
    test('should enforce name uniqueness when appending elements', () => {
      listMemory.append('item1', 'Data 1', 'First item');

      // Try to add another element with the same name - should throw error
      expect(() => {
        listMemory.append('item1', 'Different data', 'Second item');
      }).toThrow("RawMemory with name 'item1' already exists in ListMemory 'test_list'");

      // Verify only one element was added
      expect(listMemory.length).toBe(1);
    });

    test('should enforce name uniqueness when inserting elements', () => {
      listMemory.append('item1', 'Data 1');
      listMemory.append('item3', 'Data 3');

      // Try to insert with existing name - should throw error
      expect(() => {
        listMemory.insertAt(1, 'item1', 'Data 2');
      }).toThrow("RawMemory with name 'item1' already exists in ListMemory 'test_list'");

      // Verify no element was inserted
      expect(listMemory.length).toBe(2);
      expect(listMemory.getAt(1)?.name).toBe('item3');
    });

    test('should enforce name uniqueness in deque operations', () => {
      listMemory = new ListMemory('deque_test', 'Test Deque', 'deque');

      listMemory.pushFront('item1', 'Data 1');

      // Try to push with same name at front - should throw error
      expect(() => {
        listMemory.pushFront('item1', 'Different data');
      }).toThrow("RawMemory with name 'item1' already exists in ListMemory 'deque_test'");

      // Try to push with same name at back - should throw error
      expect(() => {
        listMemory.pushBack('item1', 'Different data');
      }).toThrow("RawMemory with name 'item1' already exists in ListMemory 'deque_test'");
    });

    test('should enforce name uniqueness in stack operations', () => {
      listMemory = new ListMemory('stack_test', 'Test Stack', 'stack');

      listMemory.pushTop('item1', 'Data 1');

      // Try to push with same name - should throw error
      expect(() => {
        listMemory.pushTop('item1', 'Different data');
      }).toThrow("RawMemory with name 'item1' already exists in ListMemory 'stack_test'");
    });

    test('should get RawMemory by name using getByName method', () => {
      listMemory.append('apple', 'Apple data', 'Red fruit');
      listMemory.append('banana', 'Banana data', 'Yellow fruit');
      listMemory.append('carrot', 'Carrot data', 'Orange vegetable');

      const apple = listMemory.getByName('apple');
      expect(apple).toBeDefined();
      expect(apple?.name).toBe('apple');
      expect(apple?.data).toBe('Apple data');
      expect(apple?.description).toBe('Red fruit');

      const banana = listMemory.getByName('banana');
      expect(banana?.name).toBe('banana');

      const nonExistent = listMemory.getByName('nonexistent');
      expect(nonExistent).toBeUndefined();
    });

    test('should maintain nameMap after removal operations', () => {
      listMemory.append('item1', 'Data 1');
      listMemory.append('item2', 'Data 2');
      listMemory.append('item3', 'Data 3');

      // Remove middle element
      const removed = listMemory.removeAt(1);
      expect(removed.name).toBe('item2');

      // Should not be able to find removed item
      expect(listMemory.getByName('item2')).toBeUndefined();

      // Other items should still be accessible
      expect(listMemory.getByName('item1')).toBeDefined();
      expect(listMemory.getByName('item3')).toBeDefined();

      // Should be able to add new item with same name as removed one
      listMemory.insertAt(1, 'item2', 'New Data 2');
      const newItem = listMemory.getByName('item2');
      expect(newItem?.data).toBe('New Data 2');
    });

    test('should maintain nameMap after clear operation', () => {
      listMemory.append('item1', 'Data 1');
      listMemory.append('item2', 'Data 2');

      expect(listMemory.getByName('item1')).toBeDefined();
      expect(listMemory.getByName('item2')).toBeDefined();

      listMemory.clear();

      expect(listMemory.getByName('item1')).toBeUndefined();
      expect(listMemory.getByName('item2')).toBeUndefined();
      expect(listMemory.length).toBe(0);
    });

    test('should rebuild nameMap correctly in fromJSON', () => {
      // Create original list and add elements
      const originalList = new ListMemory('original', 'Original List', 'array');
      originalList.append('item1', 'Data 1');
      originalList.append('item2', 'Data 2');

      // Serialize to JSON
      const json = originalList.toJSON();

      // Deserialize from JSON
      const restoredList = ListMemory.fromJSON(json);

      // Test that nameMap was properly rebuilt
      expect(restoredList.getByName('item1')).toBeDefined();
      expect(restoredList.getByName('item2')).toBeDefined();
      expect(restoredList.getByName('item1')?.data).toBe('Data 1');
      expect(restoredList.getByName('item2')?.data).toBe('Data 2');

      // Test that name uniqueness is enforced after restoration
      expect(() => {
        restoredList.append('item1', 'Duplicate data');
      }).toThrow("RawMemory with name 'item1' already exists in ListMemory 'original'");
    });

    test('should maintain nameMap consistency in deque pop operations', () => {
      listMemory = new ListMemory('deque_test', 'Test Deque', 'deque');

      listMemory.pushBack('item1', 'Data 1');
      listMemory.pushBack('item2', 'Data 2');
      listMemory.pushBack('item3', 'Data 3');

      // Pop from front
      const popped = listMemory.popFront();
      expect(popped.name).toBe('item1');
      expect(listMemory.getByName('item1')).toBeUndefined();
      expect(listMemory.getByName('item2')).toBeDefined();

      // Pop from back
      const poppedBack = listMemory.popBack();
      expect(poppedBack.name).toBe('item3');
      expect(listMemory.getByName('item3')).toBeUndefined();
      expect(listMemory.getByName('item2')).toBeDefined();
    });

    test('should maintain nameMap consistency in stack pop operations', () => {
      listMemory = new ListMemory('stack_test', 'Test Stack', 'stack');

      listMemory.pushTop('bottom', 'Bottom data');
      listMemory.pushTop('middle', 'Middle data');
      listMemory.pushTop('top', 'Top data');

      // Pop from top
      const popped = listMemory.popTop();
      expect(popped.name).toBe('top');
      expect(listMemory.getByName('top')).toBeUndefined();
      expect(listMemory.getByName('middle')).toBeDefined();

      // Pop again
      const popped2 = listMemory.popTop();
      expect(popped2.name).toBe('middle');
      expect(listMemory.getByName('middle')).toBeUndefined();
      expect(listMemory.getByName('bottom')).toBeDefined();
    });
  });

  describe('Additional Functionality Tests', () => {
    test('should handle JSON serialization and deserialization', () => {
      // Add some elements
      listMemory.append('item1', 'Data 1', 'First item');
      listMemory.append('item2', 'Data 2', 'Second item');

      // Serialize to JSON
      const json = listMemory.toJSON();
      expect(json.name).toBe('test_list');
      expect(json.type).toBe('list');
      expect(json.role).toBe('array');
      expect(json.list).toHaveLength(2);

      // Deserialize from JSON
      const newList = ListMemory.fromJSON(json);
      expect(newList.name).toBe('test_list');
      expect(newList.description).toBe('Test List Memory');
      expect(newList.role).toBe('array');
      expect(newList.length).toBe(2);
      expect(newList.getAt(0)?.name).toBe('item1');
      expect(newList.getAt(1)?.name).toBe('item2');
    });

    test('should handle edge cases in search functionality', () => {
      // Test with empty pattern
      const allResults = listMemory.search();
      expect(allResults).toHaveLength(0); // Empty list should return empty results

      // Add elements and test again
      listMemory.append('test1', 'Test data 1');
      listMemory.append('test2', 'Test data 2');

      const allResultsWithElements = listMemory.search();
      expect(allResultsWithElements).toHaveLength(2);
    });

    test('should handle complex patterns', () => {
      listMemory.append('Apple', 'Apple data', 'A fruit');
      listMemory.append('APPLE', 'APPLE data', 'Another fruit');

      const lowerResults = listMemory.search('AP+.*');
      expect(lowerResults.length).toBe(2);

      const exactResults = listMemory.search('Apple');
      expect(exactResults.length).toBe(2);
      expect(exactResults[0].data.name).toBe('Apple');
      expect(exactResults[1].data.name).toBe('APPLE');
    });
  });

  describe('NamePath Helper Integration Tests', () => {
    let storage: JsonStorage;
    let tempDbPath: string;

    beforeEach(async () => {
      // Create a temporary database file for testing
      tempDbPath = path.join(__dirname, '..', '..', 'temp_test_db.json');
      storage = new JsonStorage(tempDbPath);

      // Create a list memory and add it to storage
      listMemory = new ListMemory('test_list', 'Test List for NamePath', 'array');
      listMemory.append('first_item', 'First data content', 'First description');
      listMemory.append('second_item', 'Second data content', 'Second description');
      listMemory.append('third_item', 'Third data content', 'Third description');

      await storage.addMemory(listMemory);
    });

    afterEach(() => {
      // Clean up temporary database file
      try {
        if (fs.existsSync(tempDbPath)) {
          fs.unlinkSync(tempDbPath);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    describe('Index-based Access', () => {
      test('should access RawMemory by numeric index', () => {
        const [getter] = NamePathHelper.GetAndUpdate(storage, 'test_list<:0:>');
        const rawMemory = getter();

        expect(rawMemory.name).toBe('first_item');
        expect(rawMemory.data).toBe('First data content');
        expect(rawMemory.description).toBe('First description');
      });

      test('should access RawMemory by different indices', () => {
        // Test index 1
        const [getter1] = NamePathHelper.GetAndUpdate(storage, 'test_list<:1:>');
        const rawMemory1 = getter1();
        expect(rawMemory1.name).toBe('second_item');

        // Test index 2
        const [getter2] = NamePathHelper.GetAndUpdate(storage, 'test_list<:2:>');
        const rawMemory2 = getter2();
        expect(rawMemory2.name).toBe('third_item');
      });

      test('should throw error for invalid index', () => {
        expect(() => {
          const [getter] = NamePathHelper.GetAndUpdate(storage, 'test_list<:10:>');
          getter();
        }).toThrow('Index 10 out of bounds for list of length 3');
      });

      test('should throw error for negative index', () => {
        expect(() => {
          const [getter] = NamePathHelper.GetAndUpdate(storage, 'test_list<:-1:>');
          getter();
        }).toThrow('Index -1 out of bounds for list of length 3');
      });
    });

    describe('Special Flag Access', () => {
      test('should access RawMemory using FRONT flag', () => {
        const [getter] = NamePathHelper.GetAndUpdate(storage, 'test_list<:FRONT:>');
        const rawMemory = getter();

        expect(rawMemory.name).toBe('first_item');
        expect(rawMemory.data).toBe('First data content');
      });

      test('should access RawMemory using BACK flag', () => {
        const [getter] = NamePathHelper.GetAndUpdate(storage, 'test_list<:BACK:>');
        const rawMemory = getter();

        expect(rawMemory.name).toBe('third_item');
        expect(rawMemory.data).toBe('Third data content');
      });

      test('should access RawMemory using TOP flag (same as BACK)', () => {
        const [getter] = NamePathHelper.GetAndUpdate(storage, 'test_list<:TOP:>');
        const rawMemory = getter();

        expect(rawMemory.name).toBe('third_item');
        expect(rawMemory.data).toBe('Third data content');
      });
    });

    describe('Search-based Access', () => {
      test('should access RawMemory by searching name', () => {
        const [getter] = NamePathHelper.GetAndUpdate(storage, 'test_list<::>second_item');
        const rawMemory = getter();

        expect(rawMemory.name).toBe('second_item');
        expect(rawMemory.data).toBe('Second data content');
        expect(rawMemory.description).toBe('Second description');
      });

      test('should access RawMemory by exact name match only', () => {
        const [getter] = NamePathHelper.GetAndUpdate(storage, 'test_list<::>first_item');
        const rawMemory = getter();

        expect(rawMemory.name).toBe('first_item');
        expect(rawMemory.data).toBe('First data content');
        expect(rawMemory.description).toBe('First description');
      });

      test('should throw error when searching by description (not supported)', () => {
        expect(() => {
          NamePathHelper.GetAndUpdate(storage, 'test_list<::>First description');
        }).toThrow("Memory 'First description' not found");
      });

      test('should throw error when searching by data content (not supported)', () => {
        expect(() => {
          NamePathHelper.GetAndUpdate(storage, 'test_list<::>Third data content');
        }).toThrow("Memory 'Third data content' not found");
      });

      test('should throw error when search finds no results', () => {
        expect(() => {
          NamePathHelper.GetAndUpdate(storage, 'test_list<::>nonexistent_item');
        }).toThrow("Memory 'nonexistent_item' not found");
      });
    });

    describe('Update Operations', () => {
      test('should update RawMemory data through NamePathHelper', async () => {
        const [getter, updater] = NamePathHelper.GetAndUpdate(storage, 'test_list<:1:>');
        let rawMemory = getter();

        // Create a new RawMemory with updated data
        const updatedRawMemory = {
          ...rawMemory,
          data: 'Updated second data content',
          description: 'Updated second description'
        };

        // Update the storage with the new object
        await updater(updatedRawMemory as any);

        // Verify the update by getting a fresh reference
        const [getterAfter] = NamePathHelper.GetAndUpdate(storage, 'test_list<:1:>');
        const updatedMemory = getterAfter();

        expect(updatedMemory.data).toBe('Updated second data content');
        expect(updatedMemory.description).toBe('Updated second description');
        expect(updatedMemory.name).toBe('second_item'); // Name should remain unchanged
      });

      test('should update RawMemory acceStreamableHTTPd by search', async () => {
        const [getter, updater] = NamePathHelper.GetAndUpdate(storage, 'test_list<::>first_item');
        const rawMemory = getter();

        // Create a new RawMemory with updated data
        const updatedRawMemory = {
          ...rawMemory,
          data: 'Modified first data'
        };

        // Update the storage
        await updater(updatedRawMemory as any);

        // Verify the update by accessing through index
        const [getterByIndex] = NamePathHelper.GetAndUpdate(storage, 'test_list<:0:>');
        const updatedMemory = getterByIndex();

        expect(updatedMemory.data).toBe('Modified first data');
      });
    });

    describe('Integration with Different List Roles', () => {
      test('should work with deque role lists', async () => {
        const dequeList = new ListMemory('deque_list', 'Test Deque', 'deque');
        dequeList.pushFront('front_item', 'Front data', 'Front description');
        dequeList.pushBack('back_item', 'Back data', 'Back description');

        await storage.addMemory(dequeList);

        // Test FRONT access
        const [frontGetter] = NamePathHelper.GetAndUpdate(storage, 'deque_list<:FRONT:>');
        const frontMemory = frontGetter();
        expect(frontMemory.name).toBe('front_item');

        // Test BACK access
        const [backGetter] = NamePathHelper.GetAndUpdate(storage, 'deque_list<:BACK:>');
        const backMemory = backGetter();
        expect(backMemory.name).toBe('back_item');
      });

      test('should work with stack role lists', async () => {
        const stackList = new ListMemory('stack_list', 'Test Stack', 'stack');
        stackList.pushTop('bottom_item', 'Bottom data', 'Bottom description');
        stackList.pushTop('top_item', 'Top data', 'Top description');

        await storage.addMemory(stackList);

        // Test TOP access
        const [topGetter] = NamePathHelper.GetAndUpdate(storage, 'stack_list<:TOP:>');
        const topMemory = topGetter();
        expect(topMemory.name).toBe('top_item');

        // Test index access
        const [indexGetter] = NamePathHelper.GetAndUpdate(storage, 'stack_list<:0:>');
        const bottomMemory = indexGetter();
        expect(bottomMemory.name).toBe('bottom_item');
      });
    });

    describe('Error Handling', () => {
      test('should throw error for non-existent list', () => {
        expect(() => {
          NamePathHelper.GetAndUpdate(storage, 'nonexistent_list<:0:>');
        }).toThrow("Memory 'nonexistent_list' not found");
      });

      test('should throw error for invalid namePath format', () => {
        expect(() => {
          NamePathHelper.GetAndUpdate(storage, 'invalid_format');
        }).toThrow('Invalid namePath format');
      });

      test('should throw error when list is empty', async () => {
        const emptyList = new ListMemory('empty_list', 'Empty list', 'array');
        await storage.addMemory(emptyList);

        expect(() => {
          const [getter] = NamePathHelper.GetAndUpdate(storage, 'empty_list<:0:>');
          getter();
        }).toThrow('Index 0 out of bounds for list of length 0');
      });

      test('should handle search with special characters', () => {
        listMemory.append('special_item', 'Data with special chars: test', 'Description with symbols: @#$');

        const [getter] = NamePathHelper.GetAndUpdate(storage, 'test_list<::>special_item');
        const rawMemory = getter();

        expect(rawMemory.name).toBe('special_item');
        expect(rawMemory.data).toBe('Data with special chars: test');
      });
    });

    describe('Complex Scenarios', () => {
      test('should handle multiple operations on same RawMemory', async () => {
        const [getter, updater] = NamePathHelper.GetAndUpdate(storage, 'test_list<:1:>');
        let rawMemory = getter();

        // First update
        const firstUpdate = {
          ...rawMemory,
          data: 'First update'
        };
        await updater(firstUpdate as any);

        // Second update
        rawMemory = getter(); // Get fresh reference
        const secondUpdate = {
          ...rawMemory,
          description: 'Second update'
        };
        await updater(secondUpdate as any);

        // Verify both updates
        const [finalGetter] = NamePathHelper.GetAndUpdate(storage, 'test_list<:1:>');
        const finalMemory = finalGetter();

        expect(finalMemory.data).toBe('First update');
        expect(finalMemory.description).toBe('Second update');
      });

      test('should maintain data consistency across different access methods', async () => {
        // Update via index
        const [indexGetter, indexUpdater] = NamePathHelper.GetAndUpdate(storage, 'test_list<:0:>');
        const memoryByIndex = indexGetter();
        const updatedMemory = {
          ...memoryByIndex,
          data: 'Updated via index'
        };
        await indexUpdater(updatedMemory as any);

        // Verify via search
        const [searchGetter] = NamePathHelper.GetAndUpdate(storage, 'test_list<::>first_item');
        const memoryBySearch = searchGetter();

        expect(memoryBySearch.data).toBe('Updated via index');
        expect(memoryBySearch.name).toBe('first_item');
      });

      test('should handle concurrent access patterns', async () => {
        // Simulate accessing the same RawMemory through different paths
        const [searchGetter] = NamePathHelper.GetAndUpdate(storage, 'test_list<::>second_item');
        const [indexGetter] = NamePathHelper.GetAndUpdate(storage, 'test_list<:1:>');

        const memoryBySearch = searchGetter();
        const memoryByIndex = indexGetter();

        // Both should reference the same RawMemory
        expect(memoryBySearch.name).toBe(memoryByIndex.name);
        expect(memoryBySearch.data).toBe(memoryByIndex.data);

        // Test that name uniqueness is enforced - both access methods should find the same item
        expect(memoryBySearch.name).toBe('second_item');
        expect(memoryByIndex.name).toBe('second_item');
      });
    });
  });

  // =================== ListMemory Handler Tests ===================
  describe('ListMemory Handler Tests', () => {
    let storage: JsonStorage;
    let tempDbPath: string;
    let listMemory: ListMemory;

    beforeEach(async () => {
      tempDbPath = path.join(__dirname, '..', '..', 'temp_test_list_handlers.db.json');
      storage = new JsonStorage(tempDbPath);
      listMemory = new ListMemory('test_list', 'Test List for handlers', 'array');
      listMemory.append('item1', 'Data for item 1', 'First item');
      listMemory.append('item2', 'Data for item 2', 'Second item');
      listMemory.append('item3', 'Data for item 3', 'Third item');
      await storage.addMemory(listMemory);
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

    describe('addMemory Handler', () => {
      test('should create ListMemory successfully', async () => {
        const request: AddListMemoryRequest = {
          name: 'test_new_list',
          description: 'Test New List Memory',
          role: 'array'
        };

        const result = await addMemoryHandler.addListMemory(storage, request);

        expect(result.success).toBe(true);
        expect(result.data.message).toContain("ListMemory 'test_new_list' created successfully");
        expect(result.data.type).toBe('list');
        expect(result.data.listLength).toBe(0);
        expect(result.data.role).toBe('array');
      });

      test('should create all ListMemory roles', async () => {
        const roles = ['array', 'deque', 'stack'] as const;

        for (const role of roles) {
          const request: AddListMemoryRequest = {
            name: `test_${role}_list`,
            description: `Test ${role} list`,
            role
          };

          const result = await addMemoryHandler.addListMemory(storage, request);
          expect(result.success).toBe(true);
          expect(result.data.role).toBe(role);
        }
      });

      test('should throw error for duplicate ListMemory name', async () => {
        const request: AddListMemoryRequest = {
          name: 'test_list', // Already exists
          description: 'Duplicate List',
          role: 'array'
        };

        await expect(addMemoryHandler.addListMemory(storage, request))
          .rejects.toThrow("Memory 'test_list' already exists");
      });
    });

    describe('deleteListElementByName Handler', () => {
      test('should delete element by name successfully', async () => {
        const request = {
          name: 'test_list',
          child_name: 'item2'
        };

        const result = await deleteListElementByNameHandler(storage, request);

        expect(result.success).toBe(true);
        expect(result.data.message).toContain("Element 'item2' deleted successfully from 'test_list'");
        expect(result.data.elementName).toBe('item2');
        expect(result.data.index).toBe(1);
        expect(result.data.beforeLength).toBe(3);
        expect(result.data.afterLength).toBe(2);
        expect(result.data.deletedElement.name).toBe('item2');
      });

      test('should throw error for non-existent list', async () => {
        const request = {
          name: 'nonexistent_list',
          child_name: 'item1'
        };

        await expect(deleteListElementByNameHandler(storage, request))
          .rejects.toThrow("Memory 'nonexistent_list' not found");
      });

      test('should throw error for non-existent element', async () => {
        const request = {
          name: 'test_list',
          child_name: 'nonexistent_item'
        };

        await expect(deleteListElementByNameHandler(storage, request))
          .rejects.toThrow("Memory 'nonexistent_item' not found");
      });
    });

    describe('searchMemory Handler (ListMemory Tests)', () => {
      test('should return ListMemory results with correct metadata', async () => {
        // Add another list
        const listMemory2 = new ListMemory('list_test_2', 'Test list memory 2', 'deque');
        listMemory2.pushFront('deque_item1', 'Deque data 1');
        listMemory2.pushBack('deque_item2', 'Deque data 2');
        await storage.addMemory(listMemory2);

        const request: SearchMemoryRequest = {
          query: {
            type: 'list'
          }
        };

        const response = await searchMemoryHandler(storage, request);

        expect(response.success).toBe(true);
        const listResults = response.data.results.filter((r: ExtendedSearchResult) => r.type === 'list');
        expect(listResults).toHaveLength(2);

        listResults.forEach((result: ExtendedSearchResult) => {
          expect(result.metadata).toBeDefined();
          expect((result.metadata as any).length).toBeDefined();
          expect((result.metadata as any).role).toBeDefined();
        });
      });

      test('should filter ListMemory results by pattern', async () => {
        const request: SearchMemoryRequest = {
          query: {
            pattern: 'list',
            type: 'list'
          }
        };

        const response = await searchMemoryHandler(storage, request);

        expect(response.success).toBe(true);
        response.data.results.forEach((result: ExtendedSearchResult) => {
          expect(result.type).toBe('list');
          expect(result.name).toContain('list');
          expect(result.metadata).toBeDefined();
        });
      });
    });
  });

  // =================== ListMemory Integration Tests ===================
  describe('ListMemory Integration Tests', () => {
    let storage: JsonStorage;
    let tempDbPath: string;

    beforeEach(async () => {
      tempDbPath = path.join(__dirname, '..', '..', 'temp_test_list_integration.db.json');
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

    describe('Name Uniquity Mechanism', () => {
      test('should maintain nameMap consistency after deletion', async () => {
        const listMemory = new ListMemory('test_list', 'Test List', 'array');
        listMemory.append('item1', 'Data 1', 'Desc 1');
        listMemory.append('item2', 'Data 2', 'Desc 2');
        listMemory.append('item3', 'Data 3', 'Desc 3');
        listMemory.append('item4', 'Data 4', 'Desc 4');
        await storage.addMemory(listMemory);

        // Delete an element
        await deleteListElementByNameHandler(storage, {
          name: 'test_list',
          child_name: 'item2'
        });

        // Verify nameMap consistency
        const updatedMemory = storage.getMemory('test_list') as any;
        const updatedList = ListMemory.fromJSON(updatedMemory);

        expect(updatedList.getByName('item1')).toBeDefined();
        expect(updatedList.getByName('item2')).toBeUndefined();
        expect(updatedList.getByName('item3')).toBeDefined();
        expect(updatedList.getByName('item4')).toBeDefined();
      });

      test('should allow reusing deleted name', async () => {
        const listMemory = new ListMemory('test_list', 'Test List', 'array');
        listMemory.append('item1', 'Data 1', 'Desc 1');
        listMemory.append('item2', 'Data 2', 'Desc 2');
        await storage.addMemory(listMemory);

        // Delete an element
        await deleteListElementByNameHandler(storage, {
          name: 'test_list',
          child_name: 'item2'
        });

        // Should be able to reuse the name
        const updatedMemory = storage.getMemory('test_list') as any;
        const updatedList = ListMemory.fromJSON(updatedMemory);

        expect(() => {
          updatedList.append('item2', 'New data', 'New description');
        }).not.toThrow();

        expect(updatedList.getByName('item2')).toBeDefined();
        expect(updatedList.getByName('item2')?.data).toBe('New data');
      });
    });

    describe('Multiple List Roles', () => {
      test('should work with deque role lists', async () => {
        const dequeList = new ListMemory('deque_test', 'Test Deque', 'deque');
        dequeList.pushFront('front_item', 'Front data', 'Front description');
        dequeList.pushBack('back_item', 'Back data', 'Back description');
        await storage.addMemory(dequeList);

        const result = await deleteListElementByNameHandler(storage, {
          name: 'deque_test',
          child_name: 'front_item'
        });

        expect(result.success).toBe(true);
        expect(result.data.metadata.role).toBe('deque');
        expect(result.data.afterLength).toBe(1);
      });

      test('should work with stack role lists', async () => {
        const stackList = new ListMemory('stack_test', 'Test Stack', 'stack');
        stackList.pushTop('bottom_item', 'Bottom data', 'Bottom description');
        stackList.pushTop('top_item', 'Top data', 'Top description');
        await storage.addMemory(stackList);

        const result = await deleteListElementByNameHandler(storage, {
          name: 'stack_test',
          child_name: 'top_item'
        });

        expect(result.success).toBe(true);
        expect(result.data.metadata.role).toBe('stack');
        expect(result.data.afterLength).toBe(1);
      });
    });

    describe('Data Integrity', () => {
      test('should preserve data integrity after multiple deletions', async () => {
        const listMemory = new ListMemory('test_list', 'Test List', 'array');
        listMemory.append('item1', 'Data 1', 'Desc 1');
        listMemory.append('item2', 'Data 2', 'Desc 2');
        listMemory.append('item3', 'Data 3', 'Desc 3');
        listMemory.append('item4', 'Data 4', 'Desc 4');
        listMemory.append('item5', 'Data 5', 'Desc 5');
        await storage.addMemory(listMemory);

        // Delete multiple elements
        await deleteListElementByNameHandler(storage, {
          name: 'test_list',
          child_name: 'item2'
        });

        await deleteListElementByNameHandler(storage, {
          name: 'test_list',
          child_name: 'item4'
        });

        // Verify data integrity
        const finalMemory = storage.getMemory('test_list') as any;
        const finalList = ListMemory.fromJSON(finalMemory);

        expect(finalList.length).toBe(3);
        expect(finalList.getByName('item1')).toBeDefined();
        expect(finalList.getByName('item3')).toBeDefined();
        expect(finalList.getByName('item5')).toBeDefined();
        expect(finalList.getByName('item2')).toBeUndefined();
        expect(finalList.getByName('item4')).toBeUndefined();
      });

      test('should persist changes to storage', async () => {
        const request: AddListMemoryRequest = {
          name: 'test_persistence',
          description: 'Test List Persistence',
          role: 'array'
        };

        await addMemoryHandler.addListMemory(storage, request);

        // Create new storage instance to verify persistence
        const newStorage = new JsonStorage(tempDbPath);
        const persistedMemory = newStorage.getMemory('test_persistence');
        expect(persistedMemory).toBeDefined();
        expect(persistedMemory?.name).toBe('test_persistence');
        expect((persistedMemory as any).role).toBe('array');
      });
    });
  });
});
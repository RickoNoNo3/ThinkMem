import { ListMemory } from '../../src/memory/ListMemory';

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
      listMemory.append('apple_pie', 'Pie with apples', 'Dessert');
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
      const dataResults = listMemory.search('content');
      expect(dataResults.length).toBe(3); // Should find apple, banana, carrot

      // Search in description
      const descResults = listMemory.search('Red');
      expect(descResults.length).toBeGreaterThan(0);
      expect(descResults[0].data.name).toBe('apple'); // Apple should have highest similarity score
    });

    test('should return search results', () => {
      const results = listMemory.search('data');
      expect(results.length).toBe(3); // Should find all elements containing 'data'
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
});
import { RawMemory } from '../../src/memory/RawMemory';

describe('RawMemory Unit Tests', () => {
  let rawMemory: RawMemory;

  beforeEach(() => {
    rawMemory = new RawMemory('test_memory', 'Test Raw Memory', 'Line 1: First content\nLine 2: Second content\nLine 3: Third content');
  });

  describe('Initialization and Basic Properties', () => {
    test('should create memory with correct properties', () => {
      expect(rawMemory.name).toBe('test_memory');
      expect(rawMemory.description).toBe('Test Raw Memory');
      expect(rawMemory.data).toBe('Line 1: First content\nLine 2: Second content\nLine 3: Third content');
      expect(rawMemory.nLines).toBe(3);
      expect(rawMemory.nChars).toBe(66);
      expect(rawMemory.summaries).toHaveLength(0);
    });

    test('should create empty memory', () => {
      const emptyMemory = new RawMemory('empty', 'Empty memory', '');
      expect(emptyMemory.data).toBe('');
      expect(emptyMemory.nLines).toBe(0);
      expect(emptyMemory.nChars).toBe(0);
      expect(emptyMemory.summaries).toHaveLength(0);
    });

    test('should calculate correct line count', () => {
      const singleLine = new RawMemory('single', 'Single line', 'Just one line');
      expect(singleLine.nLines).toBe(1);

      const multipleLines = new RawMemory('multi', 'Multiple lines', 'Line 1\nLine 2\nLine 3\nLine 4');
      expect(multipleLines.nLines).toBe(4);

      const withEmptyLines = new RawMemory('empty_lines', 'With empty lines', 'Line 1\n\nLine 3\n\nLine 5');
      expect(withEmptyLines.nLines).toBe(5);
    });

    test('should calculate correct word count', () => {
      const singleWord = new RawMemory('single', 'Single word', 'word');
      expect(singleWord.nChars).toBe(4);

      const multiWord = new RawMemory('multi', 'Multi word', 'word1 word2 word3');
      expect(multiWord.nChars).toBe(17);

      const mixedCase = new RawMemory('mixed', 'Mixed case', 'Word1 WORD2 word3');
      expect(mixedCase.nChars).toBe(17);
    });

    test('should handle unicode and special characters', () => {
      const unicodeMemory = new RawMemory('unicode', 'Unicode test', '中文内容\n日本語\n한국어\n🚀 emoji');
      expect(unicodeMemory.nLines).toBe(4);
      expect(unicodeMemory.nChars).toBe(21);
      expect(unicodeMemory.data).toBe('中文内容\n日本語\n한국어\n🚀 emoji');
    });
  });

  describe('Write Operations', () => {
    test('should write new content completely', () => {
      const newData = 'Completely new content\nWith multiple lines\nAnd more content';
      rawMemory.write(newData);

      expect(rawMemory.data).toBe(newData);
      expect(rawMemory.nLines).toBe(3);
      expect(rawMemory.summaries).toHaveLength(0); // Summaries should be cleared on write
    });

    test('should write empty content', () => {
      rawMemory.write('');

      expect(rawMemory.data).toBe('');
      expect(rawMemory.nLines).toBe(0);
      expect(rawMemory.summaries).toHaveLength(0);
    });

    test('should write single line', () => {
      rawMemory.write('Single line content');

      expect(rawMemory.data).toBe('Single line content');
      expect(rawMemory.nLines).toBe(1);
      expect(rawMemory.nChars).toBe(19);
    });

    test('should clear summaries when writing new content', () => {
      // Add some summaries first
      rawMemory.addSummary(0, 1, 'Test summary 1-2');
      rawMemory.addSummary(2, 2, 'Test summary 3');
      expect(rawMemory.summaries).toHaveLength(2);

      // Write new content
      rawMemory.write('New content');

      // Summaries should be cleared
      expect(rawMemory.summaries).toHaveLength(0);
    });
  });

  describe('Append Operations', () => {
    test('should append content correctly', () => {
      const originalData = rawMemory.data;
      const originalLength = rawMemory.nLines;

      rawMemory.append('Line 4: Appended content');

      expect(rawMemory.data).toBe(originalData + '\nLine 4: Appended content');
      expect(rawMemory.nLines).toBe(originalLength + 1);
      expect(rawMemory.nChars).toBe(91); // 66 + 4 words
    });

    test('should append to empty memory', () => {
      const emptyMemory = new RawMemory('empty', 'Empty', '');
      emptyMemory.append('First line');

      expect(emptyMemory.data).toBe('First line');
      expect(emptyMemory.nLines).toBe(1);
      expect(emptyMemory.nChars).toBe(10);
    });

    test('should append empty string', () => {
      const originalData = rawMemory.data;
      const originalLength = rawMemory.nLines;

      rawMemory.append('');

      // Empty string append adds a new line
      expect(rawMemory.data).toBe(originalData + '\n');
      expect(rawMemory.nLines).toBe(originalLength + 1);
    });

    test('should append multiple lines', () => {
      const originalData = rawMemory.data;

      rawMemory.append('Line 4: Multi\nLine 5: line\nLine 6: append');

      expect(rawMemory.data).toBe(originalData + '\nLine 4: Multi\nLine 5: line\nLine 6: append');
      expect(rawMemory.nLines).toBe(6);
    });
  });

  describe('Insert Operations', () => {
    test('should insert line at specific position', () => {
      rawMemory.insert(1, 'Inserted line 1.5');

      const lines = rawMemory.data.split('\n');
      expect(lines).toHaveLength(4);
      expect(lines[0]).toBe('Line 1: First content');
      expect(lines[1]).toBe('Inserted line 1.5');
      expect(lines[2]).toBe('Line 2: Second content');
      expect(lines[3]).toBe('Line 3: Third content');
    });

    test('should insert at beginning', () => {
      rawMemory.insert(0, 'New first line');

      const lines = rawMemory.data.split('\n');
      expect(lines).toHaveLength(4);
      expect(lines[0]).toBe('New first line');
      expect(lines[1]).toBe('Line 1: First content');
    });

    test('should insert at end', () => {
      rawMemory.insert(3, 'New last line');

      const lines = rawMemory.data.split('\n');
      expect(lines).toHaveLength(4);
      expect(lines[3]).toBe('New last line');
    });

    test('should handle invalid insert positions gracefully', () => {
      const originalData = rawMemory.data;

      // Negative position
      rawMemory.insert(-1, 'Invalid position');
      expect(rawMemory.data).toBe(originalData);

      // Position beyond end
      rawMemory.insert(10, 'Invalid position');
      expect(rawMemory.data).toBe(originalData);

      // Position at exact end should work
      rawMemory.insert(3, 'Valid end position');
      expect(rawMemory.data).toBe(originalData + '\nValid end position');
    });

    test('should insert empty string', () => {
      const originalLength = rawMemory.nLines;

      rawMemory.insert(1, '');

      // Inserting empty string should not change the line count
      expect(rawMemory.nLines).toBe(originalLength);
      // Data should remain unchanged
      expect(rawMemory.data).toBe('Line 1: First content\nLine 2: Second content\nLine 3: Third content');
    });

    test('should clean affected summaries on insert', () => {
      // Add summary covering line 3
      rawMemory.addSummary(0, 1, 'Summary of line 1-2');
      rawMemory.addSummary(2, 2, 'Summary of line 3');
      rawMemory.addSummary(1, 2, 'Summary of line 2-3');
      expect(rawMemory.summaries).toHaveLength(3);

      // Insert line before line 2, which should affect the summary
      rawMemory.insert(2, 'New inserted line');

      // Summary below the inserted line should be pushed down
      // between the inserted line should be removed
      expect(rawMemory.summaries.length).toBe(2);
      expect(rawMemory.summaries[0].lineBeg).toBe(0);
      expect(rawMemory.summaries[0].lineEnd).toBe(1);
      expect(rawMemory.summaries[0].text).toBe('Summary of line 1-2');
      expect(rawMemory.summaries[1].lineBeg).toBe(3);
      expect(rawMemory.summaries[1].lineEnd).toBe(3);
      expect(rawMemory.summaries[1].text).toBe('Summary of line 3');
    });
  });

  describe('Delete Operations', () => {
    test('should delete content within line range', () => {
      rawMemory.delete(1, 2);

      const lines = rawMemory.data.split('\n');
      expect(lines[0]).toBe('Line 1: First content');
    });

    test('should clean affected summaries on delete', () => {
      // Add summary covering line 2-3
      rawMemory.addSummary(0, 0, 'Summary of line 1');
      rawMemory.addSummary(1, 2, 'Summary of line 2-3');
      expect(rawMemory.summaries).toHaveLength(2);

      // Delete content from line 2
      rawMemory.delete(1, 1);

      // Summary should be removed
      expect(rawMemory.summaries.length).toBe(1);
      expect(rawMemory.summaries[0].lineBeg).toBe(0);
      expect(rawMemory.summaries[0].lineEnd).toBe(0);
    });
  });

  describe('Replace Operations', () => {
    test('should replace content with pattern', () => {
      rawMemory.replace(0, 2, 'content', 'REPLACED');

      expect(rawMemory.data).toContain('REPLACED');
      expect(rawMemory.data).not.toContain('content');
    });

    test('should replace with regex pattern', () => {
      rawMemory.replace(0, 1, '^Line', 'ROW');

      expect(rawMemory.data).toContain('ROW 1: First content');
      expect(rawMemory.data).toContain('Line 2: Second content'); // Not affected
      expect(rawMemory.data).toContain('Line 3: Third content'); // Not affected
    });

    test('should handle replace with no matches', () => {
      const originalData = rawMemory.data;
      rawMemory.replace(0, 2, 'nonexistent', 'REPLACED');

      expect(rawMemory.data).toBe(originalData);
    });

    test('should handle invalid line ranges for replace', () => {
      const originalData = rawMemory.data;

      rawMemory.replace(-1, 0, 'content', 'REPLACED');
      expect(rawMemory.data).toBe(originalData);

      rawMemory.replace(10, 20, 'content', 'REPLACED');
      expect(rawMemory.data).toBe(originalData);
    });

    test('should clean affected summaries on replace', () => {
      // Add summary covering line 1
      rawMemory.addSummary(0, 0, 'Summary of line 1');
      rawMemory.addSummary(1, 2, 'Summary of line 2-3');
      expect(rawMemory.summaries).toHaveLength(2);

      // Replace content in line 1
      rawMemory.replace(1, 1, 'Second', 'Modified');

      // Summary should be removed or adjusted
      expect(rawMemory.summaries.length).toBe(1);
      expect(rawMemory.summaries[0].lineEnd).toBe(0);
    });
  });

  describe('Summary Management', () => {
    test('should add summary successfully', () => {
      rawMemory.addSummary(0, 1, 'Summary of first two lines');

      expect(rawMemory.summaries).toHaveLength(1);
      expect(rawMemory.summaries[0].lineBeg).toBe(0);
      expect(rawMemory.summaries[0].lineEnd).toBe(1);
      expect(rawMemory.summaries[0].text).toBe('Summary of first two lines');
    });

    test('should add multiple non-overlapping summaries', () => {
      rawMemory.addSummary(0, 0, 'Summary of line 0');
      rawMemory.addSummary(1, 1, 'Summary of line 1');
      rawMemory.addSummary(2, 2, 'Summary of line 2');

      expect(rawMemory.summaries).toHaveLength(3);
    });

    test('should delete summary', () => {
      rawMemory.addSummary(0, 1, 'Summary 1');
      rawMemory.addSummary(2, 2, 'Summary 2');

      expect(rawMemory.summaries).toHaveLength(2);

      rawMemory.deleteSummary(0, 1);
      expect(rawMemory.summaries).toHaveLength(1);
      expect(rawMemory.summaries[0].lineBeg).toBe(2);
      expect(rawMemory.summaries[0].lineEnd).toBe(2);
    });
  });

  describe('Query Operations', () => {
    test('should read specific line range', () => {
      const result = rawMemory.readData(0, 1);

      expect(result).toBe('Line 1: First content\nLine 2: Second content');
    });

    test('should read single line', () => {
      const result = rawMemory.readData(1, 1);

      expect(result).toBe('Line 2: Second content');
    });

    test('should read all lines', () => {
      const result = rawMemory.readData(0, 2);

      expect(result).toBe('Line 1: First content\nLine 2: Second content\nLine 3: Third content');
    });

    test('should handle invalid read ranges gracefully', () => {
      expect(rawMemory.readData(-1, 0)).toBe('');
      expect(rawMemory.readData(10, 15)).toBe('');
      expect(rawMemory.readData(2, 1)).toBe(''); // start > end
    });

    test('should search for similar lines', () => {
      const results = rawMemory.searchLines('Second');

      expect(results.length).toBeGreaterThan(0);
      // Should find the line containing "Second"
      const secondLine = results.find(r => r.lineNo === 1);
      expect(secondLine).toBeDefined();
      expect(secondLine!.text).toBe('Line 2: Second content');
    });

    test('should read with summary coverage', () => {
      rawMemory.addSummary(0, 2, 'Complete summary of all content');

      const result = rawMemory.read(0, 2);

      expect(result.data).toBe('summarized'); // Should be placeholded since fully covered
      expect(result.summaries).toHaveLength(1);
      expect(result.summaries[0].text).toBe('Complete summary of all content');
      expect(result.happyToSum).toBe(false);
    });

    test('should read with partial summary coverage', () => {
      rawMemory.addSummary(0, 0, 'Summary of first line');

      const result = rawMemory.read(0, 2);

      expect(result.data).toBe('Line 1: First content\nLine 2: Second content\nLine 3: Third content');
      expect(result.summaries).toHaveLength(1);
      expect(result.happyToSum).toBe(false); // 3 lines total, 1 covered
    });

    test('should suggest summary addition for long ranges', () => {
      const longMemory = new RawMemory('long', 'Long memory', '');

      // Add 25 lines
      for (let i = 0; i < 250; i++) {
        longMemory.append(`Line ${i + 1}: Some content here`);
      }

      const result = longMemory.read(0, 249);
      expect(result.happyToSum).toBe(true); // should suggest summary
    });

    test('should not suggest summary for short ranges', () => {
      const result = rawMemory.read(0, 1);
      expect(result.happyToSum).toBe(false); // Only 2 lines
    });

    test('should handle read with empty memory', () => {
      const emptyMemory = new RawMemory('empty', 'Empty', '');

      const result = emptyMemory.read(0, 0);

      expect(result.data).toBe('');
      expect(result.summaries).toHaveLength(0);
      expect(result.happyToSum).toBe(false);
    });
  });
});
/**
 * 文本处理工具函数
 */

/**
 * 计算文本的行数
 */
export function countLines(text: string): number {
  if (!text) return 0;
  return text.split('\n').length;
}

/**
 * 计算文本的字符数
 */
export function countChars(text: string): number {
  if (!text) return 0;
  return text.length;
}

/**
 * 按行分割文本
 */
export function splitIntoLines(text: string): string[] {
  if (!text) return [];
  return text.split('\n');
}

/**
 * 获取指定行的内容
 */
export function getLines(text: string, startLine: number, endLine?: number): string {
  const lines = splitIntoLines(text);
  const actualEnd = endLine !== undefined ? endLine : startLine;

  if (startLine < 0 || actualEnd >= lines.length || startLine > actualEnd) {
    return '';
  }

  return lines.slice(startLine, actualEnd + 1).join('\n');
}

/**
 * 替换指定行范围的内容
 */
export function replaceLines(text: string, startLine: number, endLine: number, newText: string): string {
  const lines = splitIntoLines(text);

  if (startLine < 0 || endLine >= lines.length || startLine > endLine) {
    return text;
  }

  const newLines = splitIntoLines(newText);
  const result = [
    ...lines.slice(0, startLine),
    ...newLines,
    ...lines.slice(endLine + 1)
  ];

  return result.join('\n');
}

/**
 * 在指定行插入内容
 */
export function insertLines(text: string, insertLine: number, newText: string): string {
  const lines = splitIntoLines(text);

  if (insertLine < 0 || insertLine > lines.length) {
    return text;
  }

  const newLines = splitIntoLines(newText);
  const result = [
    ...lines.slice(0, insertLine),
    ...newLines,
    ...lines.slice(insertLine)
  ];

  return result.join('\n');
}

/**
 * 删除指定行范围的内容
 */
export function deleteLines(text: string, startLine: number, endLine: number): string {
  const lines = splitIntoLines(text);

  if (startLine < 0 || endLine >= lines.length || startLine > endLine) {
    return text;
  }

  const result = [
    ...lines.slice(0, startLine),
    ...lines.slice(endLine + 1)
  ];

  return result.join('\n');
}

/**
 * 使用正则表达式替换文本
 */
export function replaceWithPattern(text: string, pattern: string, replacement: string): string {
  try {
    const regex = new RegExp(pattern, 'g');
    return text.replace(regex, replacement);
  } catch (error) {
    console.error('Invalid regex pattern:', pattern);
    return text;
  }
}
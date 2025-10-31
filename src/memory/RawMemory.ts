import { RawMemory as IRawMemory, MemorySummary } from '../types';
import {
  countLines,
  countChars,
  getLines,
  replaceLines,
  insertLines,
  deleteLines,
  replaceWithPattern
} from '../utils/textUtils';

/**
 * 原始文本记忆类
 * Lines从0开始计数
 */

export class RawMemory implements IRawMemory {
  public name: string;
  public type: "raw" = "raw";
  public description: string;
  public data: string;
  public summaries: MemorySummary[];
  public nLines: number;
  public nChars: number;

  constructor(name: string, description: string, data: string = '') {
    this.name = name;
    this.description = description;
    this.data = data;
    this.summaries = [];
    this.nLines = countLines(data);
    this.nChars = countChars(data);
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.nLines = countLines(this.data);
    this.nChars = countChars(this.data);
  }

  /**
   * 清理受影响的摘要
   */
  private cleanAffectedSummaries(lineBeg: number, lineEnd?: number): void {
    this.summaries = this.summaries.filter(summary => {
      // 如果未指定结束行，则涉及起始行之后行的总结全部删除
      if (!lineEnd) {
        return summary.lineEnd < lineBeg;
      }
      // 否则，如果摘要与修改的行有重叠，则删除
      return summary.lineEnd < lineBeg || summary.lineBeg > lineEnd;
    });
  }

  /**
   * 写入操作（替换所有数据）
   */
  write(data: string): void {
    this.data = data;
    this.summaries = []; // 清空所有摘要
    this.updateStats();
  }

  /**
   * 追加操作
   */
  append(data: string): void {
    this.data += (this.data ? '\n' : '') + data;
    this.updateStats();
  }

  /**
   * 替换操作
   */
  replace(lineBeg: number, lineEnd: number, pattern: string, text: string): void {
    const targetLines = getLines(this.data, lineBeg, lineEnd);
    const replacedLines = replaceWithPattern(targetLines, pattern, text);
    const replacedLinesCount = countLines(replacedLines);
    this.cleanAffectedSummaries(lineBeg, lineEnd);
    this.data = replaceLines(this.data, lineBeg, lineEnd, replacedLines);
    const lineOffset = replacedLinesCount - (lineEnd - lineBeg + 1);
    // 调整后续摘要的行号
    this.summaries.forEach(summary => {
      if (summary.lineBeg >= lineBeg) {
        summary.lineBeg += lineOffset;
        summary.lineEnd += lineOffset;
      }
    })
    this.updateStats();
  }

  /**
   * 插入操作
   */
  insert(line: number, text: string): void {
    this.data = insertLines(this.data, line, text);
    const lineCount = countLines(text);
    // 插入行影响到的摘要需要清理
    this.summaries = this.summaries.filter(summary => {
      return !(summary.lineBeg < line && summary.lineEnd >= line);
    });
    // 插入行后面的摘要需要调整行号
    this.summaries.forEach(summary => {
      if (summary.lineBeg >= line) {
        summary.lineBeg += lineCount;
        summary.lineEnd += lineCount;
      }
    });
    this.updateStats();
  }

  /**
   * 删除操作
   */
  delete(lineBeg: number, lineEnd: number): void {
    this.data = deleteLines(this.data, lineBeg, lineEnd);
    this.cleanAffectedSummaries(lineBeg, lineEnd);

    // 重新计算所有摘要的行号（由于删除可能改变行数）
    const deletedLines = lineEnd - lineBeg;
    if (deletedLines > 0) {
      this.summaries.forEach(summary => {
        if (summary.lineBeg > lineEnd) {
          summary.lineBeg -= deletedLines;
          summary.lineEnd -= deletedLines;
        }
      });
    }

    this.updateStats();
  }

  /**
   * 添加摘要
   */
  addSummary(lineBeg: number, lineEnd: number, text: string): void {
    // 检查行范围是否有效
    if (lineBeg < 0 || lineEnd >= this.nLines || lineBeg > lineEnd) {
      throw new Error(`Invalid line range: ${lineBeg}-${lineEnd}`);
    }

    // 检查是否与现有摘要重叠
    const hasOverlap = this.summaries.some(summary => summary.lineBeg <= lineBeg && summary.lineEnd >= lineEnd);

    if (hasOverlap) {
      throw new Error(`Summary range ${lineBeg}-${lineEnd} overlaps with existing summary`);
    }

    this.summaries.push({
      lineBeg,
      lineEnd,
      text
    });
  }

  /**
   * 删除摘要
   */
  deleteSummary(lineBeg: number, lineEnd: number): void {
    this.summaries = this.summaries.filter(summary =>
      !(summary.lineBeg === lineBeg && summary.lineEnd === lineEnd)
    );
  }

  /**
   * 清空摘要
   */
  clearSummaries(): void {
    this.summaries = [];
  }

  /**
   * 读取指定行范围的数据
   */
  readData(lineBeg: number, lineEnd: number): string {
    return getLines(this.data, lineBeg, lineEnd);
  }

  /**
   * 搜索包含关键字的行（支持正则表达式）
   */
  searchLines(pattern: string): Array<{lineNo: number, text: string}> {
    const re = new RegExp(pattern, 'i');
    const lines = this.data.split('\n');
    const matches: Array<{lineNo: number; text: string}> = [];
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        matches.push({ lineNo: i, text: lines[i] });
      }
    }
    return matches;
  }

  /**
   * 智能读取（结合摘要）
   */
  read(lineBeg: number, lineEnd: number): {
    data: string;
    summaries: MemorySummary[];
    happyToSum: boolean;
  } {
    // 获取范围内的摘要
    const relevantSummaries = this.summaries.filter(summary =>
      summary.lineBeg <= lineEnd && summary.lineEnd >= lineBeg
    );

    // 检查是否完全被摘要覆盖，使用贪心结束法
    let fullyCovered = false, converge = false, coveredLines = lineBeg - 1;
    while (!converge && relevantSummaries.length > 0) {
      converge = true;
      for (const summary of relevantSummaries) {
        if (summary.lineBeg <= coveredLines + 1 && summary.lineEnd > coveredLines) {
          coveredLines = summary.lineEnd;
          converge = false;
        }
      }
      if (coveredLines >= lineEnd) {
        fullyCovered = true;
        break;
      }
    }

    let data = 'summarized';
    if (!fullyCovered) {
      data = this.readData(lineBeg, lineEnd);
    }

    // 判断是否推荐添加摘要
    const happyToSum = !fullyCovered && ((lineEnd - lineBeg + 1) >= 20 || countChars(data) >= 300);

    return {
      data,
      summaries: relevantSummaries,
      happyToSum
    };
  }

  /**
   * 转换为智能JSON（优先使用摘要，适合用户查看）
   */
  toSmartJSON(): {
    name: string;
    description: string;
    content: any;
  } {
    const readResult = this.read(0, this.nLines - 1);
    return {
      name: this.name,
      description: this.description,
      content: readResult
    };
  }

  /**
   * 转换为JSON对象
   */
  toJSON(): IRawMemory {
    return {
      name: this.name,
      type: this.type,
      description: this.description,
      data: this.data,
      summaries: this.summaries,
      nLines: this.nLines,
      nChars: this.nChars
    };
  }

  /**
   * 从JSON对象创建实例
   */
  static fromJSON(data: IRawMemory): RawMemory {
    const rawMemory = new RawMemory(data.name, data.description, data.data);
    rawMemory.summaries = data.summaries || [];
    rawMemory.updateStats();
    return rawMemory;
  }
}
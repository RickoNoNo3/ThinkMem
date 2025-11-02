// 基础Memory类型
export interface Memory {
  name: string;
  type: "raw" | "list" | "graph";
  description: string;
}

// RawMemory数据结构
export interface RawMemory extends Memory {
  type: "raw";
  data: string;
  summaries: MemorySummary[];
  nLines: number;
  nChars: number;
}

export interface MemorySummary {
  lineBeg: number;
  lineEnd: number;
  text: string;
}

// ListMemory数据结构
export interface ListMemory extends Memory {
  type: "list";
  list: RawMemory[];
  role: "array" | "deque" | "stack";
}

// GraphMemory数据结构（暂时搁置）
export interface GraphMemory extends Memory {
  type: "graph";
  nodes: RawMemory[];
  edges: GraphEdge[];
  roleSettings: {
    role: "tree";
    root: string;
  } | {
    role: "graph";
  };
}

export interface GraphEdge extends RawMemory {
  from: string;
  to: string;
  weight: number;
  bidir: boolean;
}

// 元数据类型定义
export interface RawMemoryMetadata {
  nLines: number;
  nChars: number;
}

export interface ListMemoryMetadata {
  length: number;
  role: "array" | "deque" | "stack";
}

export interface ElementMetadata {
  metadata: RawMemoryMetadata;
}

// 统一响应类型
export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
}

export type BaseResponse = StandardResponse;

// Memory操作请求
export interface AddRawMemoryRequest {
  name: string;
  description: string;
  data: string;
}

export interface AddListMemoryRequest {
  name: string;
  description: string;
  role: "array" | "deque" | "stack";
}

export interface AddGraphMemoryRequest {
  name: string;
  description: string;
  role: "tree" | "graph";
}

export interface DeleteMemoryRequest {
  name: string;
}

export interface SearchMemoryRequest {
  query?: {
    pattern?: string;
    type?: "raw" | "list" | "graph";
  };
}

// 搜索结果相关类型使用已定义的RawMemoryMetadata和ListMemoryMetadata

// 扩展的搜索结果类型，包含特定类型的元数据
export interface ExtendedSearchResult {
  name: string;
  type: "raw" | "list" | "graph";
  description: string;
  metadata?: RawMemoryMetadata | ListMemoryMetadata;
}

export interface SearchMemoryResponse {
  results: ExtendedSearchResult[];
}

// RawMemory操作请求
export interface WriteRawRequest {
  namePath: string;
  data: string;
  isAppend?: boolean;
}

export interface ReplaceRawLinesRequest {
  namePath: string;
  lineBeg: number;
  lineEnd: number;
  pattern: string;
  text: string;
}

export interface DeleteRawLinesRequest {
  namePath: string;
  lineBeg: number;
  lineEnd: number;
}

export interface InsertRawLinesRequest {
  namePath: string;
  lineNo: number;
  text: string;
}

export interface SummarizeRawLinesRequest {
  namePath: string;
  lineBeg: number;
  lineEnd: number;
  text: string;
}

export interface DesummarizeRawLinesRequest {
  namePath: string;
  lineBeg: number;
  lineEnd: number;
}

export interface ReadRawLinesRequest {
  namePath: string;
  lineBeg?: number;
  lineEnd?: number;
  summarize?: boolean;
}

export interface ReadRawLinesResponse {
  data?: string;
  summaries?: MemorySummary[];
  happyToSum?: string;
}

// RawMemory操作响应
export interface AddRawMemoryResponse {
  message: string;
  type: "raw";
  metadata: RawMemoryMetadata;
}

export interface WriteRawResponse {
  message: string;
  operation: "write" | "append";
  metadata: RawMemoryMetadata;
}

export interface ReplaceRawLinesResponse {
  message: string;
  lineBeg: number;
  lineEnd: number;
  pattern: string;
  metadata: RawMemoryMetadata;
}

export interface DeleteRawLinesResponse {
  message: string;
  lineBeg: number;
  lineEnd: number;
  deletedLineCount: number;
  beforeLines: number;
  afterLines: number;
  metadata: RawMemoryMetadata;
}

export interface InsertRawLinesResponse {
  message: string;
  lineNo: number;
  insertedLineCount: number;
  beforeLines: number;
  afterLines: number;
  metadata: RawMemoryMetadata;
}

export interface SummarizeRawLinesResponse {
  message: string;
  lineBeg: number;
  lineEnd: number;
  summaryText: string;
  totalSummaries: number;
  metadata: RawMemoryMetadata;
}

export interface DesummarizeRawLinesResponse {
  message: string;
  lineBeg: number;
  lineEnd: number;
  deletedSummaries: number;
  beforeSummaries: number;
  afterSummaries: number;
  metadata: RawMemoryMetadata;
}

export interface SearchRawLinesRequest {
  namePath: string;
  pattern: string;
}

export interface SearchRawLinesResponse {
  lines?: Array<{
    lineNo: number;
    text: string;
  }>;
  searchPattern: string;
  totalLines: number;
  matchedLines: number;
  metadata: RawMemoryMetadata;
}

// ListMemory操作请求
export interface AppendListElementRequest {
  name: string;
  child_name: string;
  data: string;
  description: string;
}

export interface PushDequeElementRequest {
  name: string;
  child_name: string;
  data: string;
  description: string;
  position: "front" | "back";
}

export interface PushStackElementRequest {
  name: string;
  child_name: string;
  data: string;
  description: string;
}

export interface InsertListElementRequest {
  name: string;
  child_name: string;
  index: number;
  data: string;
  description: string;
}

export interface DeleteListElementRequest {
  name: string;
  index: number;
}

export interface DeleteListElementByNameRequest {
  name: string;
  child_name: string;
}

export interface PopDequeElementRequest {
  name: string;
  position: "front" | "back";
}

export interface PopStackElementRequest {
  name: string;
}

export interface ClearListRequest {
  name: string;
}

export interface GetListElementRequest {
  name: string;
  index: number;
}

export interface GetListElementResponse {
  data?: {
    name: string;
    description: string;
    content: any;
  };
  elementMetadata?: RawMemoryMetadata;
}

// Memory操作响应
export interface AddMemoryResponse {
  message: string;
  type: "raw" | "list" | "graph";
  metadata?: RawMemoryMetadata | ListMemoryMetadata;
}

export interface DeleteMemoryResponse {
  message: string;
  metadata?: RawMemoryMetadata | ListMemoryMetadata;
}

export interface PeekDequeElementRequest {
  name: string;
  position: "front" | "back";
}

export interface PeekDequeElementResponse {
  message: string;
  position: "front" | "back";
  element: {
    name: string;
    description: string;
    content: any;
  } | null;
  elementMetadata?: RawMemoryMetadata;
  metadata: ListMemoryMetadata;
}

export interface PeekStackElementRequest {
  name: string;
}

export interface PeekStackElementResponse {
  message: string;
  element: {
    name: string;
    description: string;
    content: any;
  } | null;
  elementMetadata?: RawMemoryMetadata;
  metadata: ListMemoryMetadata;
}

export interface SearchListElementsRequest {
  name: string;
  pattern?: string;
}

export interface SearchListElementsResponse {
  results: Array<{
    index: number;
    data: {
      name: string;
      description: string;
      content: any;
    };
    metadata?: RawMemoryMetadata;
  }>;
  searchPattern: string | null;
  totalElements: number;
  matchedElements: number;
  metadata: ListMemoryMetadata;
}

// ListMemory操作响应
export interface AppendListElementResponse {
  message: string;
  elementName: string;
  metadata: ListMemoryMetadata;
}

export interface PushDequeElementResponse {
  message: string;
  elementName: string;
  position: "front" | "back";
  metadata: ListMemoryMetadata;
}

export interface PushStackElementResponse {
  message: string;
  elementName: string;
  metadata: ListMemoryMetadata;
}

export interface InsertListElementResponse {
  message: string;
  elementName: string;
  index: number;
  metadata: ListMemoryMetadata;
}

export interface DeleteListElementResponse {
  message: string;
  index: number;
  deletedElement: {
    name: string;
    description: string;
    content: any;
  } | null;
  beforeLength: number;
  afterLength: number;
  metadata: ListMemoryMetadata;
}

export interface DeleteListElementByNameResponse {
  message: string;
  elementName: string;
  index: number;
  deletedElement: {
    name: string;
    description: string;
    content: any;
  } | null;
  beforeLength: number;
  afterLength: number;
  metadata: ListMemoryMetadata;
}

export interface PopDequeElementResponse {
  message: string;
  position: "front" | "back";
  poppedElement: {
    name: string;
    description: string;
    content: any;
  };
  poppedElementMetadata: RawMemoryMetadata;
  metadata: ListMemoryMetadata;
}

export interface PopStackElementResponse {
  message: string;
  poppedElement: {
    name: string;
    description: string;
    content: any;
  };
  poppedElementMetadata: RawMemoryMetadata;
  metadata: ListMemoryMetadata;
}

export interface ClearListResponse {
  message: string;
  beforeLength: number;
  afterLength: number;
  metadata: ListMemoryMetadata;
}

// 统一请求类型
export type MCPRequest =
  | AddRawMemoryRequest
  | AddListMemoryRequest
  | AddGraphMemoryRequest
  | DeleteMemoryRequest
  | SearchMemoryRequest
  | WriteRawRequest
  | ReplaceRawLinesRequest
  | DeleteRawLinesRequest
  | InsertRawLinesRequest
  | SummarizeRawLinesRequest
  | DesummarizeRawLinesRequest
  | ReadRawLinesRequest
  | SearchRawLinesRequest
  | AppendListElementRequest
  | PushDequeElementRequest
  | PushStackElementRequest
  | InsertListElementRequest
  | DeleteListElementRequest
  | DeleteListElementByNameRequest
  | PopDequeElementRequest
  | PopStackElementRequest
  | ClearListRequest
  | GetListElementRequest
  | PeekDequeElementRequest
  | PeekStackElementRequest
  | SearchListElementsRequest;

// 统一响应类型
export type MCPResponse = BaseResponse & {
  data?:
    | SearchMemoryResponse
    | ReadRawLinesResponse
    | SearchRawLinesResponse
    | GetListElementResponse
    | SearchListElementsResponse
    | AddRawMemoryResponse
    | WriteRawResponse
    | ReplaceRawLinesResponse
    | DeleteRawLinesResponse
    | InsertRawLinesResponse
    | SummarizeRawLinesResponse
    | DesummarizeRawLinesResponse
    | AppendListElementResponse
    | PushDequeElementResponse
    | PushStackElementResponse
    | InsertListElementResponse
    | DeleteListElementResponse
    | DeleteListElementByNameResponse
    | PopDequeElementResponse
    | PopStackElementResponse
    | ClearListResponse
    | PeekDequeElementResponse
    | PeekStackElementResponse
    | AddMemoryResponse
    | DeleteMemoryResponse
    | RawMemory
    | any;
};
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

// 操作请求类型定义
export interface BaseRequest {}

export interface BaseResponse {
  success: boolean;
  error?: string;
  data?: any;
}

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

export interface SearchMemoryResponse {
  results: Memory[];
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
  happyToSum?: boolean;
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
}

// ListMemory操作请求
export interface AppendListElementRequest {
  name: string;
  data: string;
  description: string;
}

export interface PushDequeElementRequest {
  name: string;
  data: string;
  description: string;
  position: "front" | "back";
}

export interface PushStackElementRequest {
  name: string;
  data: string;
  description: string;
}

export interface InsertListElementRequest {
  name: string;
  index: number;
  data: string;
  description: string;
}

export interface DeleteListElementRequest {
  name: string;
  index: number;
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
}

export interface PeekDequeElementRequest {
  name: string;
  position: "front" | "back";
}

export interface PeekStackElementRequest {
  name: string;
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
  }>;
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
    | SearchRawLinesResponse
    | RawMemory
    | any;
};
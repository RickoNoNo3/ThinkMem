#!/bin/bash

# THINK-MEM API Examples
# 使用方法: ./curl-examples.sh

SERVER_URL="http://localhost:13809"

echo "🧠 THINK-MEM API Examples"
echo "========================"
echo "服务器地址: $SERVER_URL"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 辅助函数
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    echo -e "${BLUE}➡️  $description${NC}"
    echo -e "${YELLOW}Request: $method $endpoint${NC}"
    if [ -n "$data" ]; then
        echo -e "${YELLOW}Data: $data${NC}"
    fi

    response=$(curl -s -X "$method" \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$SERVER_URL$endpoint")

    echo -e "${GREEN}Response:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    echo ""
}

# 检查服务器状态
echo -e "${BLUE}🔍 检查服务器状态${NC}"
health_response=$(curl -s "$SERVER_URL/health")
if [ -n "$health_response" ]; then
    echo -e "${GREEN}✅ 服务器运行正常${NC}"
else
    echo -e "${RED}❌ 服务器未响应${NC}"
    echo "请先启动服务器: npm start -- --mode http"
    exit 1
fi

echo -e "${BLUE}📊 服务器信息${NC}"
api_call "GET" "/info" "" "获取服务器信息"
api_call "GET" "/stats" "" "获取统计信息"

echo -e "${BLUE}📝 RawMemory 操作示例${NC}"

# 1. 添加RawMemory
api_call "POST" "/api" '{
  "action": "addMem",
  "info": {
    "name": "example_document",
    "type": "raw",
    "description": "示例文档",
    "detail": {
      "data": "这是第一行内容\n这是第二行内容\n这是第三行内容\n\n这是第五行内容，包含一些重要的信息"
    }
  }
}' "添加RawMemory"

# 2. 查询RawMemory
api_call "POST" "/api" '{
  "action": "queryRaw",
  "info": {
    "name": "example_document",
    "query": {
      "type": "read",
      "lineBeg": 0,
      "queryLineEnd": 2
    }
  }
}' "查询RawMemory前3行"

# 3. 搜索相似内容
api_call "POST" "/api" '{
  "action": "queryRaw",
  "info": {
    "name": "example_document",
    "query": {
      "type": "searchLines",
      "pattern": "重要",
      "nSimilars": 3
    }
  }
}' "搜索包含'重要'的行"

# 4. 添加摘要
api_call "POST" "/api" '{
  "action": "manageSummary",
  "info": {
    "name": "example_document",
    "operation": {
      "type": "add",
      "lineBeg": 0,
      "summaryLineEnd": 1,
      "text": "文档开头的前两行内容摘要"
    }
  }
}' "添加摘要"

# 5. 智能读取（结合摘要）
api_call "POST" "/api" '{
  "action": "queryRaw",
  "info": {
    "name": "example_document",
    "query": {
      "type": "read",
      "lineBeg": 0,
      "queryLineEnd": 4
    }
  }
}' "智能读取（显示摘要覆盖效果）"

echo -e "${BLUE}📋 ListMemory 操作示例${NC}"

# 6. 创建ListMemory
api_call "POST" "/api" '{
  "action": "addMem",
  "info": {
    "name": "example_todo_list",
    "type": "list",
    "description": "示例任务列表",
    "detail": {
      "role": "array"
    }
  }
}' "创建ListMemory（数组模式）"

# 7. 添加任务项
api_call "POST" "/api" '{
  "action": "operateList",
  "info": {
    "name": "example_todo_list",
    "operation": {
      "type": "append",
      "mem": {
        "name": "task_1",
        "data": "完成项目文档编写",
        "description": "编写完整的README和API文档"
      }
    }
  }
}' "添加第一个任务项"

api_call "POST" "/api" '{
  "action": "operateList",
  "info": {
    "name": "example_todo_list",
    "operation": {
      "type": "append",
      "mem": {
        "name": "task_2",
        "data": "实现错误处理和边界条件测试",
        "description": "添加全面的测试覆盖"
      }
    }
  }
}' "添加第二个任务项"

api_call "POST" "/api" '{
  "action": "operateList",
  "info": {
    "name": "example_todo_list",
    "operation": {
      "type": "insertAt",
      "index": 1,
      "mem": {
        "name": "task_urgent",
        "data": "修复关键的内存泄漏问题",
        "description": "高优先级修复任务"
      }
    }
  }
}' "在位置1插入紧急任务"

echo -e "${BLUE}🔄 Deque操作示例${NC}"

# 8. 创建Deque
api_call "POST" "/api" '{
  "action": "addMem",
  "info": {
    "name": "processing_queue",
    "type": "list",
    "description": "处理队列",
    "detail": {
      "role": "deque"
    }
  }
}' "创建Deque（双端队列）"

# 9. Deque操作
api_call "POST" "/api" '{
  "action": "pushFront",
  "info": {
    "name": "processing_queue",
    "mem": {
      "name": "urgent_item",
      "data": "紧急处理任务",
      "description": "需要立即处理的高优先级任务"
    }
  }
}' "推入到队列前端"

api_call "POST" "/api" '{
  "action": "pushBack",
  "info": {
    "name": "processing_queue",
    "mem": {
      "name": "normal_item",
      "data": "常规处理任务",
      "description": "普通优先级任务"
    }
  }
}' "推入到队列后端"

api_call "POST" "/api" '{
  "action": "queryFront",
  "info": {
    "name": "processing_queue"
  }
}' "查询队列前端元素"

api_call "POST" "/api" '{
  "action": "popFront",
  "info": {
    "name": "processing_queue"
  }
}' "从队列前端弹出元素"

echo -e "${BLUE}📚 Stack操作示例${NC}"

# 10. 创建Stack
api_call "POST" "/api" '{
  "action": "addMem",
  "info": {
    "name": "work_stack",
    "type": "list",
    "description": "工作栈",
    "detail": {
      "role": "stack"
    }
  }
}' "创建Stack（后进先出）"

# 11. Stack操作
api_call "POST" "/api" '{
  "action": "pushTop",
  "info": {
    "name": "work_stack",
    "mem": {
      "name": "task_1",
      "data": "第一个任务",
      "description": "开始第一个任务"
    }
  }
}' "压入第一个任务到栈顶"

api_call "POST" "/api" '{
  "action": "pushTop",
  "info": {
    "name": "work_stack",
    "mem": {
      "name": "task_2",
      "data": "第二个任务",
      "description": "接着做第二个任务"
    }
  }
}' "压入第二个任务到栈顶"

api_call "POST" "/api" '{
  "action": "queryTop",
  "info": {
    "name": "work_stack"
  }
}' "查询栈顶元素"

api_call "POST" "/api" '{
  "action": "popTop",
  "info": {
    "name": "work_stack"
  }
}' "从栈顶弹出元素"

echo -e "${BLUE}🔍 搜索和查询示例${NC}"

# 12. 搜索所有内存
api_call "POST" "/api" '{
  "action": "searchMem",
  "info": {
    "query": {
      "pattern": "任务",
      "nSimilars": 10
    },
    "page": 0
  }
}' "搜索包含'任务'的所有内存"

# 13. 按类型搜索
api_call "POST" "/api" '{
  "action": "searchMem",
  "info": {
    "query": {
      "type": "list",
      "pattern": "todo"
    },
    "page": 0
  }
}' "搜索ListMemory类型中包含'todo'的内容"

echo -e "${BLUE}📊 统计和监控示例${NC}"

# 14. 获取最新统计
api_call "GET" "/stats" "" "获取最新统计信息"

echo -e "${GREEN}✅ 所有示例执行完成！${NC}"
echo ""
echo -e "${BLUE}💡 提示：${NC}"
echo "1. 可以复制上面的curl命令到终端执行"
echo "2. 或者使用 examples/http-client.html 进行可视化操作"
echo "3. 查看 docs/HTTP-SSE-Usage.md 获取完整API文档"
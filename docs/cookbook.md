## 添加新工具/修改已有工具的步骤
- 在`src/server`文件夹中添加新的工具定义
- 在`src/types`文件夹中添加新的工具类型定义
- 在`src/server/handlers`文件夹中添加新的工具处理器
- 在`test/unit`文件夹中添加新的工具测试（尽量与已有测试组合并）
- 在`creed.md`文件中添加新的工具说明
- 在`README.md`文件中添加新的工具说明

如有修改，务必保证：
按照 handlers->types->server->unit->markdown 的优先级顺序进行覆写，确保全局每个位置表述、结构都字面级统一。

## 发布步骤
1. 修改版本号
2. 提交并同步到GitHub
3. 提交到npm
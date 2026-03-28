## ADDED Requirements

### Requirement: 首页与课程页必须分别存在独立路由页面文件
系统 MUST 提供首页与课程页两个独立页面文件与路由入口。课程页在当前阶段 MUST 支持与首页展示相同结构，但 MUST 保持独立文件以支持后续差异化演进。

#### Scenario: 路由可分别命中首页与课程页
- **WHEN** 用户分别导航到首页路由与课程路由
- **THEN** 系统 SHALL 渲染两个可独立维护的页面组件

### Requirement: 首页与课程页必须保留课程查询与新增入口占位
在首页与课程页中，系统 MUST 提供“搜索课程”和“添加课程”交互入口作为接口占位，并明确当前为未接入后端实现状态。

#### Scenario: 占位入口采用 Ant Design 组件实现
- **WHEN** 前端渲染首页或课程页的工具栏与课程内容区
- **THEN** 系统 SHALL 使用 Ant Design 的 `Input.Search`、`Button`、`Card`（或 `List` 组合）构建页面结构

#### Scenario: 无课程数据时展示标准空态
- **WHEN** 当前课程列表为空
- **THEN** 系统 SHALL 使用 Ant Design `Empty` 组件呈现空态反馈

#### Scenario: 页面展示查询与新增占位控件
- **WHEN** 用户进入首页或课程页
- **THEN** 系统 SHALL 显示课程搜索输入区域与添加课程按钮区域

#### Scenario: 接口未实现时不触发真实请求
- **WHEN** 用户在占位阶段触发搜索或添加操作
- **THEN** 系统 SHALL 执行占位交互反馈且不得发起真实课程查询或新增接口请求

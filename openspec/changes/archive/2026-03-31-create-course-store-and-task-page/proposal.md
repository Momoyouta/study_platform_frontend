# Proposal: Create Course Store and Task Detail Page

## Why
目前课程列表页的数据和查询逻辑直接写在组件内部（`MyCoursesTabContent.tsx`），这不利于数据共享和状态管理。随着课程详情页（`CourseDetail`）功能的增加（如获取描述、章节、任务等），需要一个统一的 Store 来管理这些状态。同时，任务页面需要展示 Markdown 格式的课程描述，需要引入轻量级的 Markdown 渲染组件。

## What
1. **创建 `CourseStore`**:
   - 属性：`courseList`（列表数据）、`courseId`（当前选中的课程ID）、`description`（课程描述）。
   - 方法：`fetchCourseList`（根据搜索词获取列表）、`fetchCourseDescription`（获取指定课程的描述）。
   - 预留：章节、作业等获取方法。
2. **重构课程列表页**:
   - `MyCoursesTabContent.tsx` 改为从 `CourseStore` 获取 `courseList` 并调用 `fetchCourseList`。
   - 使用 mock 数据填充 `courseList`。
3. **实现任务详情页**:
   - 在 `CourseDetail` 下实现 `task` 路由页面。
   - 引入 `@uiw/react-md-editor` 渲染 `description`。
   - 样式上直接展示文本，不添加额外的 Card 容器。

## How
- 使用 MobX 定义 `Course` 类并集成到 `RootStore`。
- 使用 `pnpm` 安装 `@uiw/react-md-editor`。
- 路由配置更新，确保 `courseDetail/task` 正确渲染。

## Out of Scope
- 本期不实现真实的 API 对接（仅预留接口位置和模拟逻辑）。
- 本期不对课程详情页的章节、作业、评论等功能进行具体实现（仅预留 store 槽位）。
- 本期暂不开启老师视角的编辑模式（但在安装库时已预留了相关编辑组件）。

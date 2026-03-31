# Tasks: Course Store and Task Detail Implementation

- [x] 安装 Markdown 库依赖
  - [x] `pnpm add @uiw/react-md-editor`
- [x] 核心 Store 开发
  - [x] 创建 `src/store/course.ts` 并定义 `CourseStore` 结构
  - [x] 在 `src/store/index.ts` 中注册并导出仓库
- [x] 列表页重构
  - [x] 将 `MyCoursesTabContent.tsx` 改为 MobX `observer`
  - [x] 迁移 Mock 数据到 `CourseStore`
  - [x] 实现列表页面的搜索联动
- [x] 详情页与任务模块实现
  - [x] 创建 `src/pages/CourseDetail/Task.tsx` 详情渲染组件
  - [x] 在 `src/pages/CourseDetail/index.jsx` 中集成 Task 组件
  - [x] 增加详情页加载数据的逻辑，由 `CourseStore` 调度
- [x] 路由配置变更
  - [x] 确保 `/courseDetail/task` 路由及其参数处理正确
- [x] 最终验证
  - [x] 测试搜索过滤功能
  - [x] 测试 Markdown 渲染效果

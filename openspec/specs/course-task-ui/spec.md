## ADDED Requirements: CourseTask UI

### 1. Markdown 渲染
- **包选择**: `@uiw/react-md-editor` (支持展示与未来的编辑需求)。
- **样式约束**: 仅展示文本，不会有图片。
- **扩展性**: 需要考虑到未来老师视角下的编辑功能（本期先仅利用它的纯渲染功能提取 `Markdown` 来做静态展示）。

### 2. 展示布局 (Task UI)
- **页面**: `src/pages/CourseDetail/Task.tsx` (对应任务路由)。
- **容器**: 不使用额外的 `Card` 组件，直接在内容区展示描述。
- **渲染样**: 使用 `@uiw/react-md-editor` 的 `.Markdown` 或预览模式即可。

### 3. 数据流
- **状态同步**: 通过 `CourseStore` 订阅 `description`。
- **路由绑定**: 在进入 `task` 路由时触发 `fetchCourseDescription(courseId)`。
- **列表页集成**: `MyCoursesTabContent.tsx` 改为订阅 `CourseStore.courseList` 展示数据。

### 4. 路由配置
- `/courseDetail/task`: 挂载在 `CourseDetail` 的子路由下。
- `/courseDetail/`: 默认或 `task` 路由。

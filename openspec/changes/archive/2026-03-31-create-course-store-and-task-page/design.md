# Design: Course Store and Task Detail Page

## Context
随着课程管理功能的深化，前端需要一个专门的状态管理单元来解耦页面逻辑。当前的架构基于 React + MobX + AntD，因此 `CourseStore` 将作为 MobX Store 集成到目前的 RootStore 体系中。

## Implementation Details

### 1. `CourseStore` 定义
- **文件路径**: `src/store/course.ts`
- **状态结构**:
  ```typescript
  class CourseStore {
    courseList: any[] = []; // 课程列表数据
    currentCourseId: string = ''; // 当前操作的课程ID
    description: string = ''; // 课程描述（Markdown 格式）
    loading: boolean = false; // 加载状态
  }
  ```
- **关键方法**:
  - `setCourseList(list: any[])`: 更新列表。
  - `fetchCourseList(params: any)`: 调用接口（本期使用模拟数据并将原有搜索逻辑迁移至此）。
  - `fetchCourseDescription(id: string)`: 获取描述信息（本期填充模拟数据）。
  - `reset()`: 重置状态。

### 2. Markdown 渲染
- **组件库**: `@uiw/react-md-editor` (自带编辑功能及纯展示组件，满足当下展示和未来的编辑需求)。
- **样式**: 直接注入到 Task 页面组件，提取 `Preview` 或 `Markdown` 展示模式，不使用 Card 容器包装内容，保持极简设计。

### 3. 组件重构
- **`MyCoursesTabContent.tsx`**:
  - 订阅 `CourseStore.courseList`。
  - 调用 `store.fetchCourseList` 进行查询。
- **CourseDetail 页面布局**:
  - 路由挂载 `/courseDetail/task`。
  - 渲染 `CourseStore.description` 内容。

## Trade-offs
- **Store 粒度**: 将列表和详情放在同一个 store 中是为了本期快速开发。如果后期功能极其复杂，可考虑拆分为 `CourseListStore` 和 `CourseDetailStore`。
- **Markdown 库**: 之前计划使用 `react-markdown` 渲染，考虑到未来直接支持良好的老师编辑视角的工具栏和插件，更换为开箱即用的 `@uiw/react-md-editor`。

## Task Breakdown
- [ ] 安装依赖 `pnpm add @uiw/react-md-editor`
- [ ] 创建 `src/store/course.ts` 并注册到 `src/store/index.ts`
- [ ] 重构 `MyCoursesTabContent.tsx`
- [ ] 开发详情页中的任务模块 (Task Page)
- [ ] 验证模拟数据加载和渲染

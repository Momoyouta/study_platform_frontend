## ADDED Requirements: CourseStore

### 1. 核心属性 (States)
- **`courseList`**: 存放从课程页获取的当页数据。本期使用模拟数据填充。
- **`courseId`**: 存放当前正在查看的课程详情 ID。
- **`courseDescription`**: 存放课程详情页（任务/详情路由）中的课程 Markdown 描述文本。

### 2. 核心方法 (Actions)
- **`fetchCourseList(params?: any)`**: 
  - 将原本位于 `MyCoursesTabContent.tsx` 中的过滤/查询逻辑移至此处。
  - 外部仅传参（如 `keyword` 等），store 内部处理数据更新。
- **`fetchCourseDescription(id: string)`**:
  - 获取指定课程的详细描述内容。
  - 本期先预留接口位置，使用模拟数据直接同步设置 `description`。

### 3. 持久化与缓存 (Optional)
- 暂时不考虑持久化，仅内存状态。

### 4. 目录结构
- **存储路径**: `src/store/course.ts`
- **注册**: 在 `src/store/index.ts` 中完成实例化，并注入到 `RootStore` 的上下文。

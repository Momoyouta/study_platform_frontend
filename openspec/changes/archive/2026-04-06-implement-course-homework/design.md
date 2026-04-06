# 课程作业系统技术方案

## Context
在现有课程详情页中集成作业模块，并提供独立的作业答题环境。

## Components

### HomeworkStore (MobX)
- 职责：管理作业列表、当前作业状态、学生答疑数据。
- 关键状态：
  - `list`: `HomeworkListItem[]`
  - `detail`: `HomeworkDetail | null`
  - `activeQuestionIndex`: `number`
  - `userAnswers`: `Record<string, any>`

### HomeworkList 页面
- 职责：展示作业列表，处理筛选与搜索。
- 位置：`src/pages/CourseDetail/Homework/index.tsx`
- 视觉重点：
  - 列表项左侧“作业”图标占位。
  - 右侧垂直居中的日期范围显示。
  - 不同状态的标签色值（进行中：蓝色，已结束：灰色）。

### HomeworkDetail 页面
- 职责：提供分栏答题环境。
- 位置：`src/pages/HomeworkDetail/index.tsx`
- 视觉重点：
  - 左侧悬浮操作按钮组（保存、提交、返回）。
  - 右侧题号网格（按题型分组，点选切换）。
  - 中间题目区域的题型渲染（单选、多选、判断、填空、简答）。

## APIs (Mock/Placeholder)
- `GET /course/homework/list`: 获取作业列表。
- `GET /course/homework/detail`: 获取作业详情与题目。
- `POST /course/homework/saveDraft`: 保存草稿。
- `POST /course/homework/submit`: 提交作业。

## Risks / Trade-offs
- **布局一致性**: 答题页需要完全屏布局，将使用独立的路由出口。
- **状态持久化**: 草稿保存目前仅保留接口位置，前端状态在 `HomeworkStore` 中内存维持。
- **编辑器集成**: `md-editor-rt` 的图片上传回调需在后续对接真实文件上传接口。

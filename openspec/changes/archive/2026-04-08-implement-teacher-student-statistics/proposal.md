## Why

当前教师端与学生端缺少可执行的学习数据统计视图，导致教师难以及时定位教学盲区、学生难以清晰追踪学习任务与进展。随着作业、课程与学习记录数据逐步沉淀，需要尽快将统计能力落地到首页、课程详情与作业概览等高频场景。

## What Changes

- 新增教师统计能力接入，覆盖待办工作台、课时学习漏斗、学习频次、成绩分布、单题正确率、提交状态追踪。
- 新增学生统计能力接入，覆盖我的课程进度、继续学习、待办作业、成绩单历史、错题复盘。
- 学生首页替换为“个人学习中心 + 任务与截止日期管理”卡片化面板，每个子项对应一个 card，并使用图表增强可视化。
- 学生课程详情页将学习记录区域替换为“个人学业档案与错题回顾”卡片区。
- 教师首页替换为待办工作台内容展示。
- 教师课程详情左侧菜单隐藏“学习记录”，改为“课程数据”，展示课程运营分析卡片区。
- 作业概览移除现有 type-stats-grid，新增考试/作业考情分析板块（成绩分布、单题正确率、提交状态）。
- 引入 @ant-design/plots 作为图表渲染库，用于漏斗、分布、频次与趋势类展示。

## Non-goals

- 不修改管理员端统计页面的业务逻辑与交互。
- 不变更后端接口定义、权限模型和鉴权流程。
- 不新增独立移动端页面，仅在现有页面内保证基础响应式可用。
- 不重构与本次统计面板无关的历史页面结构。

## Capabilities

### New Capabilities
- `teacher-course-statistics-dashboard`: 教师视角统计接口接入与课程/作业数据卡片化展示能力。
- `student-learning-statistics-center`: 学生视角统计接口接入与学习中心、截止任务、学业档案展示能力。
- `statistics-chart-rendering`: 基于 @ant-design/plots 的统一图表渲染与空态/加载态展示能力。

### Modified Capabilities
- `home-course-page-shell`: 首页按角色切换为教师待办或学生学习中心的统计化内容结构。
- `dashboard-layout-navigation`: 教师课程详情导航项由“学习记录”调整为“课程数据”，并映射新统计面板。
- `homework`: 作业概览统计区从类型网格调整为考情分析卡片与图表。

## Impact

- Affected code:
  - `src/pages/Home/**`
  - `src/pages/CourseDetail/**`
  - `src/pages/HomeworkDetail/**`
  - `src/store/**`
  - `src/env/http/**`
  - `src/type/**`
- APIs:
  - 新接入 `/teacher/statistics/*` 与 `/student/statistics/*` 接口，并支持 `courseId`、`teachingGroupId`、`assignmentId`、`startTime`、`endTime` 等查询参数。
- Dependencies:
  - 新增前端依赖 `@ant-design/plots`。
- UX:
  - 首页、课程详情、作业概览的视觉结构调整为 card + chart 导向，需要同步处理空数据与加载态。
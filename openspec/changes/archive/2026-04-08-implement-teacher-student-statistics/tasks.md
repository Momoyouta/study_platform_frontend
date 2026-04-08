## 1. 依赖与数据层准备

- [x] 1.1 安装并锁定 `@ant-design/plots` 依赖，确保项目可在现有 Vite + React 环境下正常引用
- [x] 1.2 在 `src/type` 中新增教师与学生统计 DTO 类型定义，覆盖 todo、lesson-funnel、score-distribution、question-accuracy、submission-status、my-courses、continue-learning、todo-assignments、grade-history、wrong-questions
- [x] 1.3 在 `src/env/http` 中新增 teacher/student statistics API 封装方法，并统一可选查询参数透传策略
- [x] 1.4 为统计请求补充通用错误处理与空值归一化工具（含 `null`、空数组、空对象场景）

## 2. 统计卡片与图表基础组件

- [x] 2.1 抽象统计卡片基础容器组件，统一标题区、内容区、loading/empty/error 三态呈现
- [x] 2.2 基于 `@ant-design/plots` 封装课时漏斗/学习频次图组件，并支持课时名称与数值映射
- [x] 2.3 基于 `@ant-design/plots` 封装成绩分布与单题正确率图组件，并支持分桶标签与题号映射
- [x] 2.4 为图表组件增加无数据兜底与请求失败降级展示，保证卡片结构不抖动

## 3. 教师端页面替换与考情分析

- [x] 3.1 替换教师首页为待办工作台卡片，接入 `/teacher/statistics/todo`
- [x] 3.2 调整教师课程详情左侧功能入口：隐藏“学习记录”，新增“课程数据”并挂载课程运营分析面板
- [x] 3.3 在“课程数据”面板接入 `/teacher/statistics/lesson-funnel`，展示平均观看进度与学习频次排行
- [x] 3.4 移除作业概览 `type-stats-grid`，新增成绩分布、单题正确率、提交状态追踪三个考情卡片
- [x] 3.5 在作业概览分别接入 `/teacher/statistics/score-distribution`、`/teacher/statistics/question-accuracy`、`/teacher/statistics/submission-status`

## 4. 学生端页面替换与学习档案

- [x] 4.1 替换学生首页为“个人学习中心 + 任务与截止日期管理”卡片布局
- [x] 4.2 在学生首页接入 `/student/statistics/my-courses` 与 `/student/statistics/continue-learning`
- [x] 4.3 在学生首页接入 `/student/statistics/todo-assignments`，展示截止时间与剩余时长
- [x] 4.4 在学生课程详情学习记录区域替换为“学业档案与错题回顾”卡片区
- [x] 4.5 在学生课程详情接入 `/student/statistics/grade-history` 与 `/student/statistics/wrong-questions`

## 5. 参数联动与交互一致性

- [x] 5.1 统一教师与学生统计面板的筛选参数来源（`courseId`、`teachingGroupId`、`assignmentId`、`startTime`、`endTime`）
- [x] 5.2 为统计模块增加参数变更后的请求去抖/竞态保护，避免旧请求覆盖新筛选结果
- [x] 5.3 对提交状态名单、继续学习入口、错题列表补充空态文案与跳转行为规范
- [x] 5.4 校正菜单 key、埋点标识与自动化测试选择器，匹配“课程数据”等新入口文案

## 6. 回归验证与交付检查

- [ ] 6.1 按教师角色验证首页、课程详情、作业概览三个入口的数据加载与图表渲染
- [ ] 6.2 按学生角色验证首页与课程详情的数据加载、卡片展示和截止时间计算
- [ ] 6.3 验证各统计接口在空数据、慢请求、错误响应下的降级表现
- [x] 6.4 更新变更说明文档，记录新依赖、接口映射和页面替换范围
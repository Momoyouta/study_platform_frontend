## ADDED Requirements

### Requirement: 教师统计接口必须覆盖待办与课程运营分析
系统 MUST 接入教师统计接口并在教师首页与课程详情中展示待办与课程运营分析数据，接口查询参数 MUST 支持 `courseId?`、`teachingGroupId?`、`assignmentId?`、`startTime?`、`endTime?`。

#### Scenario: 教师首页展示待批改待办
- **WHEN** 教师进入首页统计面板
- **THEN** 系统 SHALL 调用 `/teacher/statistics/todo` 并以卡片形式展示 `pendingReviewCount`

#### Scenario: 教师课程详情展示课时学习漏斗与学习频次
- **WHEN** 教师进入课程详情的“课程数据”面板
- **THEN** 系统 SHALL 调用 `/teacher/statistics/lesson-funnel` 并展示每个课时的平均学习进度与学习频次排行

### Requirement: 教师作业考情分析必须覆盖成绩分布与单题正确率
系统 MUST 在作业概览中提供成绩分布与单题正确率两类考情分析卡片，并通过教师统计接口获取真实数据。

#### Scenario: 作业概览展示成绩分布
- **WHEN** 教师打开指定作业的概览页
- **THEN** 系统 SHALL 调用 `/teacher/statistics/score-distribution` 并展示平均分、最高分、最低分与分数段分布

#### Scenario: 作业概览展示单题正确率
- **WHEN** 教师打开指定作业的概览页
- **THEN** 系统 SHALL 调用 `/teacher/statistics/question-accuracy` 并展示按题号聚合的正确率列表或图表

### Requirement: 教师必须可追踪三类提交状态学生名单
系统 MUST 在作业概览中展示未提交、已提交待批改、已批改三类学生名单，且名单来源 MUST 为教师统计接口返回数据。

#### Scenario: 展示提交状态分组名单
- **WHEN** 教师查看作业提交状态面板
- **THEN** 系统 SHALL 调用 `/teacher/statistics/submission-status` 并分别渲染 `unsubmitted`、`submittedPendingReview`、`reviewed` 三个列表

## ADDED Requirements

### Requirement: 学生首页必须展示个人学习中心统计卡片
系统 MUST 在学生首页展示“我的课程”与“继续学习”两类统计卡片，且数据 MUST 来源于学生统计接口。

#### Scenario: 展示我的课程进度列表
- **WHEN** 学生进入首页
- **THEN** 系统 SHALL 调用 `/student/statistics/my-courses` 并以课程卡片展示 `courseName` 与 `progressPercent`

#### Scenario: 展示继续学习入口
- **WHEN** 学生进入首页且存在最近学习记录
- **THEN** 系统 SHALL 调用 `/student/statistics/continue-learning` 并展示最近课时与最近学习时间，支持一键继续学习

### Requirement: 学生首页必须展示任务与截止日期管理面板
系统 MUST 在学生首页展示待办作业列表，并对每条任务展示截止时间与剩余时长。

#### Scenario: 展示待办作业与剩余时间
- **WHEN** 学生进入首页待办面板
- **THEN** 系统 SHALL 调用 `/student/statistics/todo-assignments` 并展示未完成作业标题、截止时间与 `remainSeconds`

### Requirement: 学生课程详情必须展示学业档案与错题回顾
系统 MUST 在学生课程详情中提供成绩历史与错题复盘卡片区，替代原学习记录展示。

#### Scenario: 展示成绩历史
- **WHEN** 学生进入课程详情的学业档案区域
- **THEN** 系统 SHALL 调用 `/student/statistics/grade-history` 并展示每次作业/考试的分数与教师评语

#### Scenario: 展示错题复盘列表
- **WHEN** 学生进入课程详情的错题回顾区域
- **THEN** 系统 SHALL 调用 `/student/statistics/wrong-questions` 并展示题号、所属作业与错题追踪信息

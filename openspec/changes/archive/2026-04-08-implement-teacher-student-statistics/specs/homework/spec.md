## MODIFIED Requirements

### Requirement: 教师作业概览统计必须来自统计接口
系统 MUST 使用教师统计接口替换作业概览中的 type-stats-grid 模块，并以考情分析卡片展示成绩分布、单题正确率与提交状态追踪，保证教师端看板与真实提交数据一致。

#### Scenario: 拉取作业成绩分布统计
- **WHEN** 教师进入某作业概览页
- **THEN** 系统 MUST 调用 `/teacher/statistics/score-distribution` 并展示平均分、最高分、最低分与分数段分布

#### Scenario: 拉取作业单题正确率统计
- **WHEN** 教师进入某作业概览页的正确率分析区域
- **THEN** 系统 MUST 调用 `/teacher/statistics/question-accuracy` 并展示每道题正确率

#### Scenario: 拉取作业提交状态追踪
- **WHEN** 教师查看作业提交状态面板
- **THEN** 系统 MUST 调用 `/teacher/statistics/submission-status` 并展示未提交、待批改、已批改三类学生名单

#### Scenario: 旧统计网格被移除
- **WHEN** 教师进入作业概览页
- **THEN** 页面 SHALL 不再渲染 type-stats-grid，而是渲染考情分析卡片布局

## MODIFIED Requirements

### Requirement: 答题详情逻辑
系统 MUST 在作业详情页根据用户角色提供差异化流程，并保持题号状态与 URL 参数同步。

#### Scenario: 学生模式维持现有答题流程
- **WHEN** 学生进入作业详情页并携带 `assignmentId` 或历史参数 `homeworkId`
- **THEN** 页面 MUST 归一化为 `courseId`、`assignmentId`、`questionNo` 参数，并通过 `/student/assignment/detail` 拉取可作答题目详情（不含标准答案与解析）。

#### Scenario: 学生模式切换题号
- **WHEN** 学生点击右侧题号索引
- **THEN** 中间区域 MUST 切换到对应题目，且 URL 中 `questionNo` MUST 同步更新。

#### Scenario: 教师模式显示编辑流程操作
- **WHEN** 教师进入作业详情页
- **THEN** 左侧工具栏 MUST 提供保存草稿、添加题目、发布、返回操作，中间区域 MUST 进入可编辑状态，并通过 `/teacher/assignment/detail` 拉取题目与答案详情。

#### Scenario: 教师发布前二次确认
- **WHEN** 教师点击发布按钮
- **THEN** 系统 MUST 弹窗提示“发布后不可更改”，仅在教师确认后调用发布流程（必要时先保存草稿再发布）。

#### Scenario: 发布后锁定详情页
- **WHEN** 作业状态为已发布
- **THEN** 页面 MUST 禁用题目编辑、题目新增、拖拽排序与时间窗修改，并显示不可更改提示。

## ADDED Requirements

### Requirement: 作业列表必须按角色调用对应接口
系统 MUST 按当前用户角色调用不同作业列表接口，并将返回字段映射到统一列表视图模型。

#### Scenario: 教师端拉取课程作业列表
- **WHEN** 教师进入课程作业页并传入 `course_id`
- **THEN** 系统 MUST 调用 `/teacher/assignment/list`，并展示题目数、发布时间窗、发布状态等教师视角字段。

#### Scenario: 学生端拉取可作答作业列表
- **WHEN** 学生进入课程作业页并传入 `course_id`
- **THEN** 系统 MUST 调用 `/student/assignment/list`，并展示 `submission_status` 对应的未提交/待批改/已批改状态。

### Requirement: 教师草稿保存与发布必须走真实接口
系统 MUST 使用教师作业接口持久化草稿、调整时间窗与发布状态。

#### Scenario: 保存或更新教师作业草稿
- **WHEN** 教师点击保存草稿
- **THEN** 系统 MUST 调用 `/teacher/assignment/save`，提交课程、标题、时间窗及题目列表，并在成功后同步最新 `assignment_id`。

#### Scenario: 教师调整作业开始截止时间
- **WHEN** 教师修改开始时间或截止时间并确认
- **THEN** 系统 MUST 调用 `/teacher/assignment/deadline/extend`，并在成功后更新页面展示时间。

#### Scenario: 教师确认发布作业
- **WHEN** 教师在发布确认弹窗中确认
- **THEN** 系统 MUST 调用 `/teacher/assignment/publish`，成功后将详情页切换为只读态。

### Requirement: 学生作答草稿与最终提交必须分离
系统 MUST 将学生作答草稿保存与最终提交拆分为独立接口，避免误提交。

#### Scenario: 学生保存作答草稿
- **WHEN** 学生点击保存草稿
- **THEN** 系统 MUST 调用 `/student/assignment/draft/save`，提交当前已作答题目的答案集合。

#### Scenario: 学生最终提交作业
- **WHEN** 学生确认最终提交
- **THEN** 系统 MUST 调用 `/student/assignment/submit`，并在成功后记录返回的 `submission_id` 与提交状态。

#### Scenario: 学生查看批改结果
- **WHEN** 学生作业状态可查看结果
- **THEN** 系统 MUST 调用 `/student/assignment/result` 并展示总分、教师评语、题目得分与标准答案解析。

### Requirement: 教师作业概览统计必须来自统计接口
系统 MUST 使用统计与提交接口替换概览页模拟数据，保证教师端看板与真实进度一致。

#### Scenario: 拉取作业整体统计
- **WHEN** 教师进入某作业概览页
- **THEN** 系统 MUST 调用 `/teacher/assignment/statistics` 展示总人数、已提交人数、已批改人数与题目得分率。

#### Scenario: 拉取作业提交列表
- **WHEN** 教师查看该作业提交明细
- **THEN** 系统 MUST 调用 `/teacher/assignment/submissions` 获取学生提交实体列表。

### Requirement: 题目图片上传必须区分资源类型
系统 MUST 在教师编辑态按资源类型上传题目图片与解析图片，并保证上传目标字段正确。

#### Scenario: 上传题干图片
- **WHEN** 教师上传题干图片
- **THEN** 系统 MUST 调用 `/teacher/assignment/question/image/upload`，并传递 `resource_type=1`。

#### Scenario: 上传解析图片
- **WHEN** 教师上传解析图片
- **THEN** 系统 MUST 调用 `/teacher/assignment/question/image/upload`，并传递 `resource_type=2`。

#### Scenario: 新增题目未持久化时上传图片
- **WHEN** 教师在尚未持久化且缺少后端 `question_id` 的题目上尝试上传图片
- **THEN** 系统 MUST 阻止上传并提示先保存草稿。
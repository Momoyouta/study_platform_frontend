## ADDED Requirements

### Requirement: 用户端课程列表请求不得主动传递操作者与学校标识
系统 MUST 在调用老师/学生用户端课程列表接口时仅传业务查询参数，不得主动传递 teacher_id、student_id、school_id 作为必填上下文。

#### Scenario: 老师查询所教课程
- **WHEN** 前端调用 /course/listTeacherCoursesUser
- **THEN** 系统 SHALL 仅传 page、pageSize、keyword 等业务参数
- **THEN** 系统 SHALL NOT 依赖 TeacherStore.teacherId 或 schoolId 拼接请求参数

#### Scenario: 学生查询所学课程
- **WHEN** 前端调用 /course/listStudentCoursesUser
- **THEN** 系统 SHALL 仅传 page、pageSize、keyword 等业务参数
- **THEN** 系统 SHALL NOT 依赖 StudentStore.studentId 或 schoolId 拼接请求参数

### Requirement: 学习进度读写必须依赖 BusinessToken 上下文
系统 MUST 在学习进度同步与查询时使用 BusinessToken 上下文，不得将 schoolId 作为必填参数传递。

#### Scenario: 同步课时学习进度
- **WHEN** 学生播放视频触发 /course/sync-progress
- **THEN** 系统 SHALL 发送 courseId、chapterId、lessonId、progress_percent
- **THEN** 系统 SHALL NOT 要求 schoolId 作为必填字段

#### Scenario: 查询课程学习进度
- **WHEN** 学生进入章节页触发 /course/getLearningProgress
- **THEN** 系统 SHALL 发送 courseId 并由后端上下文解析学校身份
- **THEN** 系统 SHALL 在返回成功后更新课程进度展示

### Requirement: 课程 Store 方法签名必须与去参数化约束一致
系统 MUST 将课程 Store 中课程列表与学习进度方法签名调整为去参数化调用，防止新代码继续透传废弃身份参数。

#### Scenario: 调用方触发课程列表刷新
- **WHEN** 页面调用 CourseStore 的课程列表拉取方法
- **THEN** 系统 SHALL 使用不含 teacher_id、student_id、school_id 的方法签名

#### Scenario: 调用方触发学习进度查询
- **WHEN** 页面调用 CourseStore 的学习进度查询方法
- **THEN** 系统 SHALL 使用仅包含 courseId 的参数结构

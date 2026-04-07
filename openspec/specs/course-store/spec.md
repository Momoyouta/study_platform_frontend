## Purpose
定义 CourseStore 的状态职责与接口调用约束，确保课程列表与学习进度能力统一由 store 承载，并与 BusinessToken 上下文一致，避免透传 teacher_id、student_id、school_id。

## Requirements

### Requirement: CourseStore 必须集中管理课程基础状态与方法
系统 MUST 在 `src/store/course.ts` 中维护课程列表与描述相关状态，并提供统一的拉取方法供页面调用。

#### Scenario: 维护课程页基础状态
- **WHEN** 页面进入课程列表或课程详情相关路由
- **THEN** 系统 SHALL 通过 CourseStore 维护 `courseList`、`courseId`、`courseDescription` 等状态

#### Scenario: 通过 Store 拉取课程列表与描述
- **WHEN** 调用方触发课程列表筛选或课程描述加载
- **THEN** 系统 SHALL 通过 `fetchCourseList(params)` 与 `fetchCourseDescription(id)` 进行数据更新
- **THEN** 系统 SHALL 将原页面内分散的过滤/查询逻辑收敛到 Store 层

#### Scenario: Store 注册方式保持统一
- **WHEN** 应用初始化 RootStore
- **THEN** 系统 SHALL 在 `src/store/index.ts` 中实例化并注入 CourseStore

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

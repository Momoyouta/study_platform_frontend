## 1. 认证 API 与类型契约改造

- [x] 1.1 在 src/http/api.ts 新增 auth/selectSchool、auth/switchSchool、auth/schools 的接口封装与请求参数类型。
- [x] 1.2 调整 login/register 的响应类型定义，补充 pendingToken 与 schools 结构（含 school_id、school_name、actor_type、actor_id）。
- [x] 1.3 调整课程相关 API 方法签名，移除 teacher_id、student_id、school_id 的必填要求，保留 page/pageSize/keyword 等业务参数。

## 2. UserStore 双态登录模型

- [x] 2.1 在 src/store/user.ts 增加 PendingToken、可选学校列表、当前 actor 上下文字段及本地持久化键。
- [x] 2.2 拆分并实现 Pending 会话写入与 Business 会话写入逻辑，确保选校前后状态切换清晰可回收。
- [x] 2.3 实现选校与切校动作（调用 API、换 token、更新 userProfile、同步 StudentStore/TeacherStore）。
- [x] 2.4 扩展 clearAuth/reset，确保退出登录时清理 pending/business token 与学校候选缓存。

## 3. 登录页分阶段流程

- [x] 3.1 在 src/pages/Login/index.jsx 将登录成功后的默认跳转从“直接进首页”改为“进入选校阶段”。
- [x] 3.2 新增学校选择视图与提交流程，支持多学校手动选择 school_id + actor_type。
- [x] 3.3 实现“仅一个学校时自动选校并换票”的分支逻辑，成功后进入首页。
- [x] 3.4 处理注册后 schools 为空与选校失败场景，提供可重试提示与 schools 刷新入口。

## 4. 启动恢复、路由准入与切校入口

- [x] 4.1 改造 src/main.jsx 启动恢复逻辑，区分 BusinessToken、PendingToken、未登录三类状态。
- [x] 4.2 增加业务路由准入约束：无 BusinessToken 或未完成选校时不得进入 Dashboard 页面。
- [x] 4.3 在 src/layouts/DashboardLayout/index.jsx 顶部用户区增加切校入口并对接切校动作。
- [x] 4.4 确认退出登录链路清理所有认证上下文后再跳转登录页。

## 5. 课程调用链路去参数化

- [x] 5.1 在 src/store/course.ts 调整 fetchTeacherCourses、fetchStudentCourses、fetchLearningProgress 方法签名与请求调用。
- [x] 5.2 在 src/pages/Course/MyCoursesTabContent.tsx 删除 teacher_id、student_id、school_id 的显式透传。
- [x] 5.3 在 src/pages/CourseDetail/student/Chapter.tsx 调整 syncProgress 与 getLearningProgress 调用，不再主动传 schoolId。
- [x] 5.4 搜索并清理同类“当前操作者接口”显式 school/actor 参数透传点，避免新增回归。

## 6. 联调与验收

- [ ] 6.1 验证登录分支：多学校选择、单学校自动选择、注册后无学校提示。
- [ ] 6.2 验证切校分支：切校后 token 更新、学校名称更新、课程数据刷新。
- [ ] 6.3 验证失败分支：选校失败、切校失败、401 失效回退到登录流程。
- [x] 6.4 验证课程接口请求参数：课程列表与学习进度请求不再携带 teacher_id/student_id/school_id。
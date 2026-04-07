## Context

当前前端认证与上下文模型是单阶段登录：
- `src/pages/Login/index.jsx` 在登录成功后直接 `navigate('/')`。
- `src/main.jsx` 仅识别 `access_token`，并通过 `/auth/jwtAuth` 校验后恢复用户态。
- `src/http/http.js` 请求拦截器固定注入 `access_token`。
- `src/store/user.ts` 只维护单一 token，不区分“待选校”与“业务态”会话。
- 课程相关调用链仍显式传 `teacher_id/student_id/school_id`，典型位置包括 `src/pages/Course/MyCoursesTabContent.tsx`、`src/store/course.ts`、`src/pages/CourseDetail/student/Chapter.tsx`。

目标改造引入双阶段认证：登录/注册先拿 PendingToken，再选校换发 BusinessToken。并将“当前操作者上下文（school/actor）”由 Token 承载，前端不再在操作者接口中手动传递本人 school/teacher/student 标识。

## Goals / Non-Goals

**Goals:**
- 支持登录后学校选择流程：多学校手动选，单学校自动选。
- 在前端状态层区分 PendingToken 与 BusinessToken，并保证刷新可恢复。
- 新增并接入 `/auth/selectSchool`、`/auth/switchSchool`、`/auth/schools` API。
- 将课程用户侧接口改为“去参数化调用”，不再主动传 `teacher_id/student_id/school_id`。
- 调整路由准入：未拿到 BusinessToken 时禁止进入业务页面。

**Non-Goals:**
- 不在本次改造中统一替换全项目所有遗留 schoolId 透传接口，仅覆盖需求列出的认证与课程链路。
- 不改动后端 ALS 机制与签发逻辑。
- 不新增复杂权限后台，仅在现有前端页面补充选校与切校交互。

## Decisions

### Decision 1: 在 UserStore 引入双态认证模型
- 方案：在 `src/store/user.ts` 增加 PendingToken、BusinessToken、可选学校列表与当前 actor 上下文字段；保留 `access_token` 作为 BusinessToken 存储键，新增独立 pending 存储键。
- 原因：避免请求拦截器与既有视频鉴权参数（读取 `UserStore.token`）大范围重构。
- 备选方案：改为统一 token 键并靠 token payload 区分状态。
- 放弃原因：会增加前端判定复杂度，且不利于本地恢复与调试。

### Decision 2: 登录页采用“同路由分阶段”交互
- 方案：在 `src/pages/Login/index.jsx` 内新增“学校选择阶段”视图，不引入新的公开路由；登录/注册成功后先写入 PendingToken，再进入选校阶段或自动选校。
- 原因：改动面最小，避免新增路由守卫分支与跳转闪烁。
- 备选方案：新增独立 `/select-school` 页面。
- 放弃原因：需要额外维护公开路由、样式与跨页状态传递。

### Decision 3: 选校与切校统一走“换票 + 覆盖上下文”流程
- 方案：
  - 首次选校调用 `/auth/selectSchool`（Authorization: PendingToken）。
  - 已登录切校调用 `/auth/switchSchool`（Authorization: BusinessToken）。
  - 成功后统一进入 `applyAuthResponse` 分发：更新 user/teacher/student store，并清理旧上下文缓存。
- 原因：保证切校后上下文原子更新，减少跨 store 残留状态。
- 备选方案：切校只改 schoolId，不换 token。
- 放弃原因：与后端“换发新上下文 BusinessToken”契约不一致，安全边界不足。

### Decision 4: 启动阶段由“JWT 远程校验优先”调整为“本地恢复 + 按需校验”
- 方案：`src/main.jsx` 启动时按优先级恢复：BusinessToken > PendingToken > 未登录。
  - BusinessToken：从本地 userProfile 恢复并进入业务页；首次业务请求失败由拦截器兜底踢回登录。
  - PendingToken：进入登录页选校阶段，并必要时调用 `/auth/schools` 刷新学校列表。
  - 未登录：保持现状跳登录。
- 原因：新接口未明确提供 BusinessToken 的独立校验端点，且本地恢复可降低启动等待。
- 备选方案：继续强依赖 `/auth/jwtAuth`。
- 放弃原因：接口契约已转向双阶段，`jwtAuth` 兼容性不确定。

### Decision 5: 课程相关请求改为“隐式上下文”入参
- 方案：更新 `src/http/api.ts` 与 `src/store/course.ts` 参数签名，移除对 `teacher_id/student_id/school_id` 的必填约束；调用侧不再透传这些字段。
- 原因：与后端 ALS 收口一致，减少前端拼参错误。
- 备选方案：前端继续传参，后端忽略。
- 放弃原因：会保留历史技术债，无法体现新约束并增加误导。

## Risks / Trade-offs

- [Risk] 双 token 状态切换时可能出现并发请求拿错 token → Mitigation: 选校/切校提交期间锁定操作，成功后再批量触发数据刷新。
- [Risk] 注册后 schools 为空导致无法进入业务页 → Mitigation: 在选校阶段提供明确引导（暂无可用学校/请联系管理员），并允许刷新 schools 列表。
- [Risk] 旧代码仍读取 TeacherStore/StudentStore 的 schoolId 作为请求参数 → Mitigation: 逐点移除调用侧显式透传，并在 API 层类型签名阻断新增透传。
- [Risk] 切校后页面展示残留旧学校课程数据 → Mitigation: 切校成功后重置 CourseStore/HomeworkStore 再触发当前页重拉。

## Migration Plan

1. API 与类型层改造：在 `src/http/api.ts` 增加 `selectSchool/switchSchool/getAuthSchools`，并更新认证与课程接口类型。
2. UserStore 改造：新增 PendingToken 与学校候选集、选校动作、切校动作、状态清理策略。
3. 登录页改造：新增学校选择阶段与单学校自动选校逻辑，完成 Pending -> Business 换票。
4. 启动与路由准入改造：调整 `src/main.jsx` 启动恢复逻辑，补充“未选校不可进业务页”约束。
5. 课程链路改造：`MyCoursesTabContent`、`CourseStore`、`Chapter` 去除 school/actor 显式传参。
6. 验证回归：登录、注册、单学校自动进入、多学校手动选择、切校、401 失效回退、课程列表与学习进度请求。

回滚策略：保留旧分支基线；若后端双阶段链路联调受阻，可临时兼容旧登录响应（直接 token）并保留单阶段入口开关。

## Open Questions

- [Resolved] `actor_id` 仅作为 `UserStore` 内部字段保存，不对业务页面作为显式入参透出。
- [Resolved] 保留 `/auth/jwtAuth` 作为 `BusinessToken` 的启动校验能力。
- [Resolved] 切校入口同时放置在顶部用户菜单与账号管理页。
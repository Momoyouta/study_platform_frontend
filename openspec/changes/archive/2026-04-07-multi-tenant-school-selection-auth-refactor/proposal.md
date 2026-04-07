## Why

当前登录流程为单阶段签发业务 Token，无法在多租户场景下完成学校与身份的二次确认，导致前端在多处接口调用中手动传递 school_id、teacher_id、student_id。随着学校切换需求落地，这种模式会带来上下文不一致、越权风险与维护成本上升问题，因此需要将登录改造为“先认证、后选校”的双阶段流程，并统一由 Token 承载业务上下文。

## What Changes

- 将认证流程改为双阶段：/auth/login 与 /auth/register 返回 pendingToken 与可选学校列表。
- 新增登录后选校流程：登录成功后不直接进入主页，先进入学校选择；若仅有一个可选学校则自动选择并完成换票。
- 新增 /auth/selectSchool、/auth/switchSchool、/auth/schools 对应前端调用链路与状态管理。
- 改造前端登录态模型：区分 PendingToken 与 BusinessToken，并在选校/切校后刷新 userProfile。
- 改造“当前操作者”接口调用方式：不再手动传 school_id、teacher_id、student_id，统一依赖 BusinessToken 上下文。
- 调整课程相关接口调用参数语义：listTeacherCoursesUser、listStudentCoursesUser、sync-progress、getLearningProgress 进入去参数化调用模式（兼容传参但前端不再主动传递）。
- **BREAKING**: 登录后直达首页的行为被替换为“选校完成后进入业务页面”。

## Capabilities

### New Capabilities
- `auth-school-context-bootstrap`: 支持 PendingToken 登录态、学校选择与自动选校、选校换票与切校换票、上下文化用户信息落盘与恢复。

### Modified Capabilities
- `dashboard-layout-navigation`: 路由准入从“有登录态”调整为“有 BusinessToken 且已绑定 current_school_id”，并支持切校后上下文刷新。
- `course-store`: 课程列表与学习进度相关请求改为依赖 BusinessToken 上下文，不再要求传入 school_id、teacher_id、student_id。

## Non-goals

- 不在本次改造中覆盖所有历史业务接口，仅覆盖需求中列出的认证与课程接口及其直接调用链路。
- 不改造学校与身份分配的后端管理流程与数据模型。
- 不进行全局 UI 重设计，仅新增并接入必要的选校流程交互。

## Impact

- Affected code: 登录页、路由配置与守卫、user store、course store、HTTP 请求层与 Token 持久化逻辑。
- API impact: 认证模块新增双阶段登录与换票；课程模块相关接口由前端显式传上下文改为 Token 隐式上下文。
- Dependencies: 无新增外部依赖，主要为状态与请求链路改造。
- Risks: 登录态由单态升级为双态，需处理页面刷新恢复、并发请求时序与 Token 失效降级。
## Purpose
定义认证后的学校上下文引导流程，明确 PendingToken 到 BusinessToken 的换票、切校与学校列表刷新规则，确保多租户身份切换过程一致且可恢复。

## Requirements

### Requirement: 登录与注册必须建立 Pending 会话
系统 MUST 将 /auth/login 与 /auth/register 的成功响应视为 Pending 会话初始化，不得直接进入业务页面。

#### Scenario: 登录成功且存在多个可选学校
- **WHEN** 用户提交账号密码并收到 pendingToken 与多个 schools
- **THEN** 系统 SHALL 持久化 pendingToken 与学校候选列表，并进入选校阶段
- **THEN** 系统 SHALL NOT 直接跳转到业务首页

#### Scenario: 登录成功且仅有一个可选学校
- **WHEN** 用户登录成功且 schools 仅包含一个学校身份
- **THEN** 系统 SHALL 自动调用 /auth/selectSchool 完成换票
- **THEN** 系统 SHALL 在换票成功后进入业务首页

### Requirement: 选校必须通过 PendingToken 换发 BusinessToken
系统 MUST 使用 PendingToken 调用 /auth/selectSchool，并以返回的 token 与 userProfile 覆盖当前上下文。

#### Scenario: 用户手动选择学校并换票成功
- **WHEN** 用户在选校阶段确认 school_id 与 actor_type
- **THEN** 系统 SHALL 以 Bearer PendingToken 调用 /auth/selectSchool
- **THEN** 系统 SHALL 清理 pendingToken、写入 BusinessToken，并刷新当前用户资料

#### Scenario: 选校换票失败
- **WHEN** /auth/selectSchool 返回失败或网络异常
- **THEN** 系统 SHALL 保留 pendingToken 与当前选校页面状态
- **THEN** 系统 SHALL 展示错误提示且允许用户重试

### Requirement: 切校必须换发新业务令牌并刷新上下文
系统 MUST 通过 /auth/switchSchool 完成切校，且切校后上下文必须以新令牌响应为准。

#### Scenario: 已登录用户切换到其他学校
- **WHEN** 用户在 BusinessToken 状态下选择新的 school_id 与 actor_type
- **THEN** 系统 SHALL 以 Bearer BusinessToken 调用 /auth/switchSchool
- **THEN** 系统 SHALL 用新 token 覆盖旧 token，并更新 current_school_id、actor_type、actor_id

#### Scenario: 切校成功后刷新业务数据
- **WHEN** /auth/switchSchool 返回成功
- **THEN** 系统 SHALL 清理旧学校上下文缓存并触发课程等业务数据重拉

### Requirement: 学校候选列表必须支持会话内刷新
系统 MUST 支持在 PendingToken 或 BusinessToken 状态下调用 /auth/schools 获取可用学校身份列表。

#### Scenario: 待选校阶段刷新学校列表
- **WHEN** 用户进入选校阶段且本地 schools 为空或需要刷新
- **THEN** 系统 SHALL 使用 PendingToken 调用 /auth/schools 并更新可选列表

#### Scenario: 已登录阶段刷新学校列表
- **WHEN** 用户在业务页面打开切校入口
- **THEN** 系统 SHALL 使用 BusinessToken 调用 /auth/schools 并展示结果
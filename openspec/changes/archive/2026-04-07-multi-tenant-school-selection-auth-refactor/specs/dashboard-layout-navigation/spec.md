## ADDED Requirements

### Requirement: Dashboard 路由准入必须基于 BusinessToken
系统 MUST 仅在用户持有 BusinessToken 且存在当前学校上下文时允许访问 Dashboard 业务路由。

#### Scenario: 未登录访问业务路由
- **WHEN** 用户未持有任何 token 并访问 Dashboard 路由
- **THEN** 系统 SHALL 跳转到登录页

#### Scenario: 仅有 PendingToken 访问业务路由
- **WHEN** 用户处于待选校状态并访问 Dashboard 路由
- **THEN** 系统 SHALL 阻止进入业务页面并引导完成学校选择

### Requirement: 顶部用户区必须提供切校入口
系统 MUST 在已登录业务页面提供可触达的学校切换入口，并在切校成功后刷新页面上下文。

#### Scenario: 用户打开切校入口
- **WHEN** 用户在 Dashboard 顶部用户区触发菜单
- **THEN** 系统 SHALL 展示当前可切换学校列表

#### Scenario: 用户确认切校
- **WHEN** 用户在切校入口确认目标学校身份
- **THEN** 系统 SHALL 发起切校换票并在成功后刷新业务数据与学校展示名称

## MODIFIED Requirements

### Requirement: 退出登录必须清理前端状态并跳转登录页
系统 MUST 在用户点击“退出登录”后清理 localStorage 中所有认证与用户上下文信息（包括 PendingToken、BusinessToken、用户资料、学校候选列表），并 MUST 重置内存中的用户与业务 store 状态，随后 SHALL 跳转到登录页路由。

#### Scenario: 用户执行退出登录
- **WHEN** 用户在右上角菜单中点击“退出登录”
- **THEN** 系统 SHALL 清理所有认证状态与用户上下文缓存，并导航到登录页

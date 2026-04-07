## Purpose
定义工作台主布局与导航、用户区交互和退出登录行为的统一规范，确保页面壳层可扩展且交互一致。

## Requirements

### Requirement: Dashboard 主布局必须与导航结构一致
系统 MUST 提供统一的 Dashboard 页面壳层，包含顶部栏、左侧单级菜单和右侧内容渲染区域。左侧菜单 MUST 仅包含一级菜单项，不得出现二级展开结构。

#### Scenario: 进入工作台默认展示首页
- **WHEN** 用户访问工作台入口路由
- **THEN** 系统 SHALL 高亮“首页”菜单项并在右侧渲染首页内容

#### Scenario: 菜单切换驱动右侧路由视图
- **WHEN** 用户点击“课程”“资料广场”或“个人统计”任一菜单项
- **THEN** 系统 SHALL 更新对应激活态并切换右侧内容区到对应路由页面

### Requirement: Dashboard 路由准入必须基于 BusinessToken
系统 MUST 仅在用户持有 BusinessToken 且存在当前学校上下文时允许访问 Dashboard 业务路由。

#### Scenario: 未登录访问业务路由
- **WHEN** 用户未持有任何 token 并访问 Dashboard 路由
- **THEN** 系统 SHALL 跳转到登录页

#### Scenario: 仅有 PendingToken 访问业务路由
- **WHEN** 用户处于待选校状态并访问 Dashboard 路由
- **THEN** 系统 SHALL 阻止进入业务页面并引导完成学校选择

### Requirement: 用户区下拉菜单必须提供账号管理与退出登录入口
系统 MUST 在顶部右上角展示“头像 + username”用户区，并在鼠标悬浮时显示菜单层，菜单项 MUST 包含“账号管理”和“退出登录”。

#### Scenario: 鼠标悬浮显示用户操作菜单
- **WHEN** 用户将鼠标移动到顶部右上角用户区
- **THEN** 系统 SHALL 展示包含“账号管理”“退出登录”的浮层菜单

#### Scenario: 账号管理在当前布局内切换页面
- **WHEN** 用户点击“账号管理”
- **THEN** 系统 SHALL 仅切换右侧内容路由视图，且保持当前 Dashboard 布局不发生整页跳转

### Requirement: 顶部用户区必须提供切校入口
系统 MUST 在已登录业务页面提供可触达的学校切换入口，并在切校成功后刷新页面上下文。

#### Scenario: 用户打开切校入口
- **WHEN** 用户在 Dashboard 顶部用户区触发菜单
- **THEN** 系统 SHALL 展示当前可切换学校列表

#### Scenario: 用户确认切校
- **WHEN** 用户在切校入口确认目标学校身份
- **THEN** 系统 SHALL 发起切校换票并在成功后刷新业务数据与学校展示名称

### Requirement: 退出登录必须清理前端状态并跳转登录页
系统 MUST 在用户点击“退出登录”后清理 localStorage 中所有认证与用户上下文信息（包括 PendingToken、BusinessToken、用户资料、学校候选列表），并 MUST 重置内存中的用户与业务 store 状态，随后 SHALL 跳转到登录页路由。

#### Scenario: 用户执行退出登录
- **WHEN** 用户在右上角菜单中点击“退出登录”
- **THEN** 系统 SHALL 清理所有认证状态与用户上下文缓存，并导航到登录页

### Requirement: 布局目录结构必须支持后续扩展
系统 MUST 将布局组件置于独立的 layout 层目录，并 SHALL 通过路由嵌套承载业务页面渲染，以支持后续新增布局类型。

#### Scenario: 新增 layout 不影响现有业务页面目录
- **WHEN** 项目后续新增其他 layout 类型
- **THEN** 系统 SHALL 仅在 layout 层与路由映射扩展，不要求迁移既有业务页面目录结构

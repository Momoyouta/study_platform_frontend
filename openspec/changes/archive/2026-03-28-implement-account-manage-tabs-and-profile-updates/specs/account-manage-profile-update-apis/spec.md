## ADDED Requirements

### Requirement: 用户资料更新接口必须在统一请求层暴露
系统 MUST 在前端请求层提供 `updateBasic`、`updatePhone`、`updateAvatar`、`updatePassword` 方法，并 SHALL 通过统一 HTTP 封装发起请求。

#### Scenario: 业务组件调用资料更新
- **WHEN** 账号管理面板触发资料保存动作
- **THEN** 系统 SHALL 通过请求层方法调用对应接口而非直接内联请求逻辑

### Requirement: 性别修改必须通过基础资料更新接口提交
系统 MUST 将性别更新请求发送到 `PUT /user/profile/updateBasic`，并 MUST 使用布尔值表达性别（`true` 男，`false` 女）。

#### Scenario: 用户保存性别修改
- **WHEN** 用户在基本资料面板修改性别并提交
- **THEN** 系统 SHALL 调用基础资料更新接口并在成功后更新页面展示

### Requirement: 手机号修改必须支持验证码两阶段流程
系统 MUST 支持手机号更新的两阶段调用：首次仅提交 `newPhone` 触发验证码发送；后续携带 `newPhone + code` 完成校验与更新。

#### Scenario: 用户请求发送验证码
- **WHEN** 用户输入新手机号并点击发送验证码
- **THEN** 系统 SHALL 调用 `PUT /user/profile/updatePhone` 且请求体仅包含 `newPhone`

#### Scenario: 用户提交验证码完成更新
- **WHEN** 用户输入新手机号与 6 位验证码并提交
- **THEN** 系统 SHALL 调用 `PUT /user/profile/updatePhone` 且请求体包含 `newPhone` 与 `code`

### Requirement: 头像修改必须遵循临时上传后确认保存流程
系统 MUST 先调用 `POST /file/upload/imageTemp` 上传图片并获取临时路径；用户确认保存时 MUST 调用 `PUT /user/profile/updateAvatar` 并提交 `tempAvatarPath`。

#### Scenario: 上传头像文件
- **WHEN** 用户在头像面板选择图片并执行上传
- **THEN** 系统 SHALL 调用临时上传接口并保存返回的临时路径

#### Scenario: 保存头像到正式目录
- **WHEN** 用户在已有临时路径的情况下点击保存头像
- **THEN** 系统 SHALL 调用头像更新接口并传入 `tempAvatarPath`

### Requirement: 密码修改必须校验输入并调用更新接口
系统 MUST 在提交前校验旧密码、新密码、确认密码；当新旧密码合法且确认密码一致时，系统 SHALL 调用 `PUT /user/profile/updatePassword`。

#### Scenario: 前端校验失败阻止提交
- **WHEN** 用户输入的新密码与确认密码不一致
- **THEN** 系统 SHALL 显示错误提示且不得发起密码更新请求

#### Scenario: 提交密码更新
- **WHEN** 用户输入合法的旧密码与新密码并提交
- **THEN** 系统 SHALL 调用密码更新接口并反馈结果

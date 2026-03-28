## Why

当前账号管理页面仍是占位态，无法完成基础资料维护、头像更新与密码修改，导致用户必须依赖后台或其它入口处理账户信息，流程割裂且不满足日常自助管理需求。该改动用于尽快补齐账号中心核心能力，并与现有页面风格保持一致，降低用户学习成本。

## What Changes

- 将账号管理页由占位视图改造为带 Tab 的功能页，包含“基本资料”“修改头像”“密码管理”三个面板。
- 按页面分层约定将每个 TabPanel 抽为独立组件，放置在 `src/pages/AccountManage` 下与页面入口同级的模块文件中。
- 基本资料面板展示姓名、id、性别、手机号、学校名、角色，仅开放性别与手机号修改。
- 头像面板支持先调用临时上传接口获取 `temp path`，再调用头像更新接口提交 `tempAvatarPath` 完成正式替换。
- 密码面板提供旧密码、新密码与确认密码提交，接入用户端修改密码接口并补充必要校验与交互反馈。
- 增补账号管理相关 API 封装，统一走现有 `src/http/api.ts` 请求层。

## Capabilities

### New Capabilities
- `account-manage-profile-tabs`: 提供账号管理页的 Tab 化信息展示与分面板编辑能力。
- `account-manage-profile-update-apis`: 提供基础资料、手机号、头像、密码的用户端更新交互与接口联动能力。

### Modified Capabilities
- 无。

## Impact

- Affected specs:
  - `openspec/changes/implement-account-manage-tabs-and-profile-updates/specs/account-manage-profile-tabs/spec.md`（新增）
  - `openspec/changes/implement-account-manage-tabs-and-profile-updates/specs/account-manage-profile-update-apis/spec.md`（新增）
- Affected code:
  - `src/pages/AccountManage/index.jsx` 及新增 TabPanel 组件文件与样式文件
  - `src/http/api.ts` 新增用户资料更新相关接口方法
- API usage:
  - `PUT /user/profile/updateBasic`
  - `PUT /user/profile/updatePhone`
  - `PUT /user/profile/updateAvatar`
  - `PUT /user/profile/updatePassword`
  - `POST /file/upload/imageTemp`
- Dependencies/systems:
  - Ant Design 表单、Tabs、Upload 等组件能力
  - 现有 axios 封装（返回 `response.data`）与用户资料状态来源

## Non-goals

- 本次不实现“注销账号”“语言设置”等其它 Tab 内容。
- 本次不改造后端接口协议、鉴权机制与短信服务。
- 本次不追求与设计图完全像素级一致，仅保证布局结构与交互语义符合现系统风格。

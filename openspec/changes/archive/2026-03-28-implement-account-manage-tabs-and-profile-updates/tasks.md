## 1. API 封装与数据契约

- [x] 1.1 在 `src/http/api.ts` 新增 `updateBasic`、`updatePhone`、`updateAvatar`、`updatePassword` 方法并保持现有封装风格
- [x] 1.2 为手机号更新补充两阶段调用参数约束（仅 `newPhone` / `newPhone + code`）并在页面调用层统一处理
- [x] 1.3 校验头像更新请求使用 `tempAvatarPath` 字段并与 `uploadImageTemp` 返回值打通

## 2. 账号管理页壳层与目录拆分

- [x] 2.1 重构 `src/pages/AccountManage/index.jsx`，实现账号管理头部与三标签容器布局
- [x] 2.2 在 `src/pages/AccountManage` 下新增三个同级 TabPanel 组件文件（基本资料/修改头像/密码管理）
- [x] 2.3 按页面模块新增或调整对应 less 样式文件，保证布局与现有系统风格一致

## 3. 基本资料面板实现

- [x] 3.1 在基本资料面板展示姓名、id、性别、手机号、学校名、角色字段
- [x] 3.2 将姓名、id、学校名、角色实现为只读展示，性别与手机号实现为可编辑控件
- [x] 3.3 接入 `updateBasic` 完成性别保存流程并在成功后刷新展示值
- [x] 3.4 接入 `updatePhone` 实现发码与验码更新流程，补充手机号与验证码格式校验及反馈

## 4. 头像与密码面板实现

- [x] 4.1 在头像面板接入 `uploadImageTemp` 完成图片上传并缓存临时路径
- [x] 4.2 在头像面板接入 `updateAvatar`，点击“保存头像”时提交 `tempAvatarPath`
- [x] 4.3 在密码面板实现旧密码、新密码、确认密码表单与前端一致性校验
- [x] 4.4 接入 `updatePassword` 完成密码更新提交流程并处理成功/失败提示

## 5. 联调验证与回归检查

- [x] 5.1 验证三标签切换不触发整页跳转，且默认展示基本资料面板
- [x] 5.2 验证性别、手机号、头像、密码四条更新链路的请求参数与返回处理
- [x] 5.3 执行本地 lint 或构建检查，确保新增页面组件与 API 变更无语法错误

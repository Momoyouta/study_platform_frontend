## Context
依据后端的 `video-playback-progress` 设计：
1. 采用 Nginx `auth_request` 模块实现视频鉴权。前端不再需要设法在 Request Header 携带 token，而是在 `<video>` src 的 URL 参数中带上 `?token=xxx`，Nginx 会通过 `X-Original-URI` 转发给后端进行校验，从而使原生的 `<video>` 标签完美支持原生的分片传输及范围请求 (Accept-Ranges)。
2. 支持播放进度同步：前端在视频播放时通过向后端定时心跳请求将播放进度汇报。

## Goals / Non-Goals
**Goals:**
- 实现携带 token 的受保护流媒体视频资源的加载及分片播放。
- 视频播放过程中实现打点同步请求。能够稳定地上报观看进度百分比给 `POST /course/sync-progress`。

**Non-Goals:**
- 不引入重型第三方播放器库，复用和微调现有的简易播放组件即可。
- 不处理离线观看等业务。

## Decisions

### 1. Token 附加与视频 src 拼接
**Rationale:** 原生 `<video src="url">` 无法自定义 Request Header，必须利用 Query Strings。
**Decision:** 在 `Chapter.tsx` 学生端的视频播放组件中，针对 `courseStore.courseInfo.video_path`，结合 `loginStore.token` 拼接最终给 `<video>` 的 `src` 属性值。

### 2. 视频进度状态心跳机制 (Progress Heartbeat)
**Rationale:** 学生学习期间随时可能刷新、关闭标签页或暂停。
**Decision:** 
 - 监听视频元素的 `timeupdate` 事件。
 - 计算进度：`progress = Math.floor((currentTime / duration) * 100)`。
 - 利用 `lodash` 的 `throttle` 包装同步 API 调用（例如：限制最多每 10 秒同步一次）。
 - 在 `onPause`，`onEnded` 或组件 `unmount` (useEffect 卸载函数) 时强制上报一次最新进度，防止数据丢失。

## Risks / Trade-offs
- **Risk:** 频繁执行 `timeupdate` 导致前端主线程负担增加以及 API 请求泛滥。
- **Mitigation:** 定期调用同步过程必须节流 (Throttle)。同时记录上一次汇报的进度，如果进度没有变动不发送请求。

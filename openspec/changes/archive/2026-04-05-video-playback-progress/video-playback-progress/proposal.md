# Proposal: Video Playback Progress UI

## What
在前端对接后端提供的“视频分片传输及 Nginx 鉴权放行”功能和“视频播放进度同步”心跳接口。这包括修改视频播放器的 `src` 以附加 JWT token 参数，以及在视频播放期间定期向后端同步学习进度，并在进度达到设定阈值时更新完课状态。

## Why
原有架构中直接在 NestJS 中处理视频流增加了服务器负载且效率较低。后端已将视频文件交由 Nginx 代理处理（包含 `auth_request` 内部鉴权和分片请求响应）。同时为了建立完整的学习闭环，需要跟踪并记录学生对各小节视频的观看进度，前端必须能够与新提供的 `/course/sync-progress` 接口以及携带 URL Token 参数的机制配合工作。

## Scope
- 修改 `<video>` 组件播放源获取逻辑，确保能在 URL 中附带 JWT token 以通过 Nginx 鉴权。
- 监听视频的 `timeupdate` 等事件，计算播放进度并通过特定的前端存储结构缓存和节流。
- 增加调用后端 `POST /course/sync-progress` 的 API 层逻辑。
- 涉及页面为课程详情页（特别是针对学生的观看页面：`src/pages/CourseDetail/student/Chapter.tsx` 等）。

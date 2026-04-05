## ADDED Requirements
### Requirement: 视频鉴权 URL 组装
针对视频资源，需要使用 `loginStore.token` 为 `video_path` 添加 `?token=` 参数，使源生组件能够通过 Nginx 内部鉴权同时支持分片加载。
#### Scenario: 加载受保护的流媒体视频
- **WHEN** 用户进入课时渲染小节时，解析出对应的视频 URL
- **THEN** 组件内部应附加当前的 JWT token 到视频源链接的查询参数中

### Requirement: 视频进度心跳同步 (Progress Heartbeat Sync)
需要通过 `POST /course/sync-progress` 将学生的学习进度按百分比同步给后端记录表。
#### Scenario: 视频正常播放过程中的定时心跳
- **WHEN** 视频正常播放且 `timeupdate` 时间不断更新时
- **THEN** 前端按照设计约每 10 秒（或合适阈值）节流式地调用同步 API 将进度报告给服务器。

#### Scenario: 关键操作状态同步 (暂停/卸载)
- **WHEN** 用户暂停了视频播放，或者离开/关闭了该课程小节的视图时
- **THEN** 应立即发起一次 API 同步请求保存离开前的最后进度。

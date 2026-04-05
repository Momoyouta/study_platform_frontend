# Implementation Tasks

## Phase 1: API Setup
- [x] 在 `src/api/course.ts` (如果有类似文件) 或相关 service 单中添加 `syncProgress` 接口函数。此函数发起 `POST /course/sync-progress` 请求，接收 `{ courseId, chapterId, lessonId, progressPercent }` 等参数。

## Phase 2: Video src Authentication Injection
- [x] 修改 `src/pages/CourseDetail/student/Chapter.tsx` 组件。
- [x] 确保播放时取到的 `courseStore.courseInfo.video_path` 后能正确拼接 `?token=${loginStore.token}` 给 `<video>` 元素的 `src`。

## Phase 3: Progress Sync with Heartbeat
- [x] 在 `Chapter.tsx` 中绑定 `<video>` 的 `onTimeUpdate` 事件。
- [x] 计算 `progressPercent` = 当前播放进度 / 总时长 * 100。
- [x] 引入并使用 `lodash-es` 的 `throttle` 函数限制调用频率（例如每 10 秒发起一次请求）。
- [x] 添加对 `onEnded`，`onPause` 及 React `useEffect` 卸载钩子的支持，保证在离开时最后进行一次数据打点上报。

## Phase 4: Validations
- [x] 验证：在浏览器中打开包含已有切片分段视频的课时，检查网络请求视频文件是否通过了带 `?token=xxx` 的链接且正常播放(Status 206 Partial Content)。
- [x] 验证：随着时间的播放，是否有 `POST /course/sync-progress` 请求规律性且正确带入请求体发出。

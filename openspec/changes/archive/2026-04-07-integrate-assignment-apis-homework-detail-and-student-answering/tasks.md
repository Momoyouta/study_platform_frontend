## 1. 作业 API 契约与类型定义

- [x] 1.1 在 `src/http/api.ts` 新增教师端作业接口方法：`save/publish/deadline/extend/list/detail/statistics/submissions/grade/question/image/upload`。
- [x] 1.2 在 `src/http/api.ts` 新增学生端作业接口方法：`list/detail/draft/save/submit/result`。
- [x] 1.3 为教师/学生作业接口补充请求与响应类型定义（题型、题目结构、答案结构、统计结构）。
- [x] 1.4 统一接口方法的命名与参数风格，保持项目现有 API 封装约定。

## 2. HomeworkStore 数据模型与请求流重构

- [x] 2.1 在 `src/store/homework.ts` 增加后端题型 `1~5` 与前端题型枚举的双向映射方法。
- [x] 2.2 实现题目 `content/standard_answer/analysis` 的解析与序列化转换，支持教师编辑与学生作答双场景。
- [x] 2.3 用真实接口替换 `fetchHomeworkList` 的 Mock 逻辑，并按角色分别映射教师/学生列表字段。
- [x] 2.4 用真实接口替换 `fetchHomeworkDetail` 的 Mock 逻辑，分别处理教师详情（含答案）与学生详情（含当前草稿）。
- [x] 2.5 重构 `saveDraft`：按角色分别调用 `/teacher/assignment/save` 与 `/student/assignment/draft/save`。
- [x] 2.6 重构 `submitHomework`：调用 `/student/assignment/submit` 并持久化提交状态。
- [x] 2.7 重构 `publishHomework`：实现“必要时先保存再发布”的流程并在成功后刷新详情状态。
- [x] 2.8 新增教师时间调整动作，调用 `/teacher/assignment/deadline/extend` 并同步更新本地时间窗。
- [x] 2.9 新增学生结果查询动作，调用 `/student/assignment/result` 并缓存结果供页面展示。
- [x] 2.10 新增教师题目图片上传动作，区分 `resource_type=1/2`，且在缺少后端 `question_id` 时阻止上传并提示先保存草稿。

## 3. 作业详情页面行为对接

- [x] 3.1 在 `src/pages/HomeworkDetail/index.tsx` 保持并强化 `assignmentId` 参数归一化（兼容 `homeworkId`）。
- [x] 3.2 对接教师端“保存草稿/发布/时间设定”按钮到真实 Store 动作，并处理成功/失败消息。
- [x] 3.3 对接学生端“保存草稿/最终提交”按钮到真实 Store 动作，并在提交成功后完成页面状态切换。
- [x] 3.4 在教师题目编辑区域接入真实图片上传，区分题目图片与解析图片上传路径。
- [x] 3.5 在详情页增加必要的加载态与防重复提交控制，避免重复请求造成状态错乱。

## 4. 作业列表与教师概览对接

- [x] 4.1 在 `src/pages/CourseDetail/Homework/index.tsx` 使用真实列表字段替换当前模拟状态字段映射。
- [x] 4.2 在 `src/pages/CourseDetail/Homework/components/AssignmentOverview.tsx` 用 `/teacher/assignment/statistics` 替换概览统计模拟数据。
- [x] 4.3 在概览页对接 `/teacher/assignment/detail` 展示作业基础信息，并保留异常提示与最小回退行为。
- [x] 4.4 预留并接入 `/teacher/assignment/submissions` 数据加载入口，确保后续提交明细展示可直接扩展。

## 5. 联调与验收

- [ ] 5.1 教师流程联调：列表 -> 详情编辑 -> 保存草稿 -> 时间调整 -> 发布 -> 详情只读校验。
- [ ] 5.2 学生流程联调：列表 -> 详情作答 -> 保存草稿 -> 最终提交 -> 结果查看。
- [ ] 5.3 校验异常路径：接口失败、参数缺失、时间窗非法、未持久化题目上传图片。
- [x] 5.4 执行 lint/类型检查并修复本次改动引入的问题。
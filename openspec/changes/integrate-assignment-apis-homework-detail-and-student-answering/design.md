## Context

当前作业相关页面已经具备教师端与学生端基础交互，但数据层存在明显断层：
- `src/store/homework.ts` 的列表/详情/草稿/提交/发布均为 Mock 占位。
- `src/pages/HomeworkDetail/index.tsx` 与 `src/pages/CourseDetail/Homework/index.tsx` 已有完整流程入口，但依赖本地状态，无法与后端形成一致性。
- `src/pages/CourseDetail/Homework/components/AssignmentOverview.tsx` 仍包含较多“本地示例”回退数据。

现有后端已提供教师端与学生端完整作业接口，需要在不重构页面结构的前提下完成前端对接，并保持已上线交互（题号索引、角色差异化流程、发布后只读、历史参数兼容）。

## Goals / Non-Goals

**Goals:**
- 将教师端作业列表、详情、草稿保存、发布时间调整、发布、图片上传对接到真实接口。
- 将学生端作业列表、详情、草稿保存、最终提交、结果查询对接到真实接口。
- 在 `HomeworkStore` 建立稳定的 DTO 映射层，统一题型、答案、时间字段转换。
- 保持 URL 兼容策略：优先 `assignmentId`，兼容历史 `homeworkId` 并归一化。
- 将教师作业概览中的关键统计由模拟数据替换为接口数据。

**Non-Goals:**
- 不新增独立“批改工作台”页面（仅对接当前页面可承载能力）。
- 不改动后端接口定义或字段命名。
- 不重构非作业模块的 store、路由和 UI 架构。

## Decisions

### Decision 1: 统一在 API 层定义作业接口，在 Store 层完成业务映射
- 方案：所有作业接口封装集中在 `src/http/api.ts`；`HomeworkStore` 只处理领域模型转换与页面状态。
- 原因：避免组件层出现大量接口细节，降低重复转换逻辑。
- 备选方案：组件内直接调用 HTTP 方法。
- 放弃原因：会导致教师端与学生端多个组件出现重复拼装与错误处理。

### Decision 2: 建立双向题型与答案转换器
- 方案：在 `HomeworkStore` 内维护：
  - 后端题型 `1~5` ↔ 前端题型 `single|multiple|judge|fill|short`
  - 题目 `content/standard_answer/analysis` 的安全解析与序列化
  - 学生答案与教师参考答案的双向转换
- 原因：当前 UI 组件使用前端友好模型，后端使用结构化 JSON 与数字题型，必须通过统一转换保证一致性。
- 备选方案：前端完全使用后端原始结构渲染。
- 放弃原因：会显著增加视图层复杂度，且与现有组件契约冲突较大。

### Decision 3: 发布流程强制“先保存再发布”
- 方案：教师点击发布时若当前无有效 `assignment_id`，先调用保存接口，获取 `assignment_id` 后再调用发布接口。
- 原因：发布接口仅接受 `assignment_id`；新增草稿场景下必须先落库。
- 备选方案：直接发布，失败后提示用户先保存。
- 放弃原因：交互割裂，增加人工操作步骤与失败率。

### Decision 4: 图片上传采用“已持久化题目可上传”约束
- 方案：题目图片与解析图片上传接口依赖 `question_id`，对尚未持久化的新题先提示“请先保存草稿”，保存后通过详情拉取真实 `question_id` 再允许上传。
- 原因：当前上传接口必须传 `question_id`，而本地新增题目初始仅有临时 id。
- 备选方案：本地先转 base64 并在发布时统一上传。
- 放弃原因：与后端单次上传接口契约冲突，且会增加提交失败的补偿逻辑。

### Decision 5: 教师概览统计按职责拆分接口来源
- 方案：
  - 列表信息来自 `/teacher/assignment/list`
  - 单作业统计来自 `/teacher/assignment/statistics`
  - 作业基础信息来自 `/teacher/assignment/detail`
- 原因：接口职责单一，能够替代概览页现有模拟统计。
- 备选方案：继续依赖 `/teacher/assignment/overview` 与本地回退。
- 放弃原因：与本次提供的标准接口不一致，难以扩展到真实数据闭环。

## Risks / Trade-offs

- [Risk] 题目 `content` 与 `standard_answer` JSON 结构在不同题型下不一致 → Mitigation: 在 Store 层增加运行时容错解析与默认值兜底，并记录字段级错误提示。
- [Risk] 新增题目上传图片前无后端 `question_id` → Mitigation: 前端阻断上传并引导先保存草稿，保存成功后自动刷新详情同步真实题目 ID。
- [Risk] 秒级时间戳与本地时间字符串互转出现时区偏差 → Mitigation: 统一使用秒级 Unix 时间戳作为内部传输，展示层仅做格式化。
- [Risk] 教师发布后本地状态与后端状态短暂不一致 → Mitigation: 发布成功后立即重拉详情与列表，使用后端状态覆盖本地状态。
- [Risk] 学生提交后重复提交或覆盖草稿 → Mitigation: 提交时增加二次确认与按钮防抖，提交成功后刷新详情并切换到结果态。

## Migration Plan

1. 在 `src/http/api.ts` 增加教师/学生作业接口方法与请求类型定义。
2. 重构 `src/store/homework.ts`：
   - 移除 Mock 数据分支
   - 新增 DTO 映射与序列化方法
   - 接入列表/详情/草稿/提交/发布/时间调整/图片上传等真实请求
3. 调整 `src/pages/HomeworkDetail/index.tsx` 与子组件调用，按真实接口返回处理成功/失败状态。
4. 调整 `src/pages/CourseDetail/Homework/index.tsx` 与 `AssignmentOverview.tsx`，移除模拟统计主路径并接入统计接口。
5. 联调验证：教师端（新建草稿→保存→发布→回看）、学生端（作答→草稿→提交→结果）完整回归。

回滚策略：保留本次改动前的分支基线；如接口联调阻塞，可临时保留只读回退显示，但不回退 URL 参数归一化策略。

## Open Questions

- [已确认] 新增题目的后端 `question_id` 不依赖保存响应直接回传，采用“保存后详情重拉”同步真实题目 ID。
- [已确认] 学生“查看批改结果”入口由作业列表状态驱动进入（`submission_status=2`）。
- [已确认] 教师端 `submissions/grade` 本次仅完成 API 层预接入，页面交互留待后续迭代。
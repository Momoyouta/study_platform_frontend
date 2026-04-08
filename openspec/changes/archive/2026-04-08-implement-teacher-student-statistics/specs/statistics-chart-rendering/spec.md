## ADDED Requirements

### Requirement: 统计图表必须统一使用 @ant-design/plots 渲染
系统 MUST 使用 `@ant-design/plots` 作为统计图表渲染实现，并保证教师与学生统计面板的图表配置可复用。

#### Scenario: 渲染课时漏斗与频次图
- **WHEN** 课程运营分析面板接收到课时统计数据
- **THEN** 系统 SHALL 使用 `@ant-design/plots` 渲染漏斗或柱状图以展示进度与学习频次

#### Scenario: 渲染成绩分布与正确率图
- **WHEN** 作业考情面板接收到成绩分布与题目正确率数据
- **THEN** 系统 SHALL 使用 `@ant-design/plots` 渲染分布图与正确率图并展示图例

### Requirement: 图表卡片必须提供加载态、空态与错误态
系统 MUST 在每个统计卡片内提供独立的加载、空数据和错误反馈，避免单接口异常导致整页不可用。

#### Scenario: 接口加载中
- **WHEN** 统计接口请求尚未完成
- **THEN** 系统 SHALL 在对应卡片展示 loading 态而非阻塞整个页面

#### Scenario: 接口返回空数据
- **WHEN** 统计接口返回空数组或空对象
- **THEN** 系统 SHALL 在对应卡片展示可读空态提示并保留卡片结构

#### Scenario: 接口请求失败
- **WHEN** 某个统计接口返回错误
- **THEN** 系统 SHALL 在对应卡片展示错误提示且不影响其他卡片正常渲染

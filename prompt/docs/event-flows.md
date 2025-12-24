# 事件流与降级方案（概要）

## 关键事件
- `asset.created|updated|archived`
- `evaluation.created|progress.updated|completed`
- `ai.analysis.requested|completed|failed`
- `report.generated|failed`
- `action_plan.created|status.updated`

## 评估→AI→报告流程
1) 前端创建评估 → 评估服务写库 → 发 `evaluation.created`
2) 如需数据采集：采集器异步执行，更新进度 `evaluation.progress.updated`
3) 评估服务发 `ai.analysis.requested` → AI服务调用模型，产出结构化结果，回写评估/报告草稿 → 发 `ai.analysis.completed`
4) 报告服务订阅完成事件，渲染 md/html，异步转 PDF → 发 `report.generated`
5) 通知服务订阅报告事件，发送邮件/站内信，附报告链接或附件

## 幂等与可靠性
- 幂等键：evaluation_id / idempotency_key
- 至少一次投递：消费者需检查状态防重复
- 重试与DLQ：AI/导出/通知失败进入重试队列，超阈值入DLQ+告警

## 降级策略
- AI超时：降级为简版模板（仅维度分+3行动）
- 报告导出失败：提供 HTML/Markdown 直接访问，补偿任务再试 PDF
- 通知失败：记录待补偿，退回重试队列
- 向量/检索不可用：跳过相似案例引用，继续生成基础分析

## 安全与合规
- 事件payload不含敏感PII，敏感字段使用引用ID或加密
- 权限校验在事件消费端重复校验资源归属与租户隔离
- 审计：关键事件写入 `event_log`，含 actor 与资源信息


# 架构概要

## 原则

- 模块化、微服务友好；事件驱动；无状态优先；安全内建；可观测性内建

## 服务划分（建议）

- 网关：路由、认证、限流、审计入口
- 用户服务：账户、租户、RBAC
- 资产服务：资产元数据、标签、关系（关联/组合/继承）
- 评估服务：评估流程、模板、数据采集调度
- AI 分析服务：提示词管理、模型路由、结构化输出校验
- 报告服务：报告渲染（md/html）、导出(PDF)，图表数据组装
- 通知服务：邮件/站内信/推送
- 文件服务：对象存储代理、签名 URL
- 数据服务：数据仓储/分析（可后期独立）

## 数据层

- 关系型：用户、租户、资产元数据、权限、支付/订阅
- 文档/JSON：评估结果、报告内容、模板定义
- 向量库：AI 检索、相似案例/模板召回
- 缓存：会话、热点资产/报告、幂等键
- 对象存储：上传文件、导出报告

## 集成

- 认证：OIDC/Auth0/自建
- 支付：Stripe/PayPal
- 通知：SendGrid/SES/Twilio
- 数据采集：Analytics/API/爬虫（后续扩展）
- 监控：APM、日志聚合、指标（Prometheus/Grafana）

## 技术基线（可选示例）

- 前端：React/Next.js + Tailwind/Chakra，SSR/PWA 预留
- 后端：TypeScript(Node/Nest/Fastify) 或 Go/Spring；REST+Webhooks，GraphQL 可选
- 队列：Kafka/NATS/SQS/Redis Streams
- DB：Postgres/MySQL + Redis + S3/OSS；向量库（pgvector/Weaviate）

## 安全基线

- 强制 TLS，JWT/OAuth2，细粒度 RBAC
- 输入校验、速率限制、CSRF/XSS/SQL 注入防护
- 审计日志；敏感字段加密；备份与恢复演练

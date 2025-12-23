# 数据模型草稿

## 核心实体
- 用户(user)：id，email，password_hash/oidc_sub，name，role，tenant_id，created_at，updated_at
- 租户(tenant)：id，name，plan，status，created_at，updated_at
- 资产(asset)：id，tenant_id，owner_id，name，description，type(preset/custom)，status(draft/evaluating/archived)，metadata(jsonb)，created_at，updated_at
- 标签(tag)：id，tenant_id，name，type，created_at
- 资产标签(asset_tag)：id，asset_id，tag_id
- 评估(evaluation)：id，tenant_id，asset_id，template_id，status(draft/in_progress/done)，method(manual/import/auto/mixed)，progress，created_by，created_at，updated_at
- 评估项(evaluation_item)：id，evaluation_id，dimension，weight，score，evidence，notes
- 模板(template)：id，tenant_id，name，asset_type，dimensions(jsonb: [{key,weight,description,scoring_guide}])，owner_scope(system/tenant/user)
- 报告(report)：id，evaluation_id，summary，findings(jsonb)，recommendations(jsonb)，charts(jsonb)，format(md/html/pdf_link)，created_at
- 行动计划(action_plan)：id，tenant_id，asset_id/evaluation_id，title，priority，status(todo/doing/done)，owner_id，due_date，evidence
- 事件日志(event_log)：id，tenant_id，type，resource_type，resource_id，actor_id，payload(jsonb)，created_at
- 支付/订阅(subscription/payment)：plan，status，renewal，limits

## 约束与策略
- 多租户隔离：所有核心表带 `tenant_id`；跨租户查询禁止；审计字段必填
- 软删除：deleted_at 可选；需结合唯一索引策略
- 索引：资产(name, tenant_id)、标签(name, tenant_id)、评估(asset_id, status)、事件(type, created_at)
- JSON Schema：用于校验评估结果、报告结构化字段
- 幂等：事件与异步任务使用 idempotency_key

## 示例表结构（Postgres）
- 资产 `asset`：
  - id UUID PK
  - tenant_id UUID
  - owner_id UUID
  - name text not null
  - description text
  - type text
  - status text
  - metadata jsonb default '{}'
  - created_at timestamptz default now()
  - updated_at timestamptz default now()

- 评估 `evaluation`：
  - id UUID PK
  - tenant_id UUID
  - asset_id UUID
  - template_id UUID
  - status text check in (draft, in_progress, done)
  - method text check in (manual, import, auto, mixed)
  - progress int
  - created_by UUID
  - created_at timestamptz default now()
  - updated_at timestamptz default now()

- 报告 `report`：
  - id UUID PK
  - evaluation_id UUID unique
  - summary text
  - findings jsonb
  - recommendations jsonb
  - charts jsonb
  - format text
  - created_at timestamptz default now()


import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant-id' },
    update: {},
    create: {
      id: 'default-tenant-id',
      name: 'Default Organization',
      plan: 'enterprise',
      status: 'active',
    },
  });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password,
      role: 'admin',
      tenantId: tenant.id,
    },
  });

  // Create some dummy assets
  const assets = await Promise.all([
    prisma.asset.create({
      data: {
        name: 'Project Alpha',
        description: 'Internal development project',
        type: 'project',
        status: 'active',
        tenantId: tenant.id,
        ownerId: admin.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Global Supply Chain',
        description: 'Strategic supply chain initiative',
        type: 'supply_chain',
        status: 'active',
        tenantId: tenant.id,
        ownerId: admin.id,
      },
    }),
  ]);

  // Create Tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: 'High Priority', type: 'priority', tenantId: tenant.id },
    }),
    prisma.tag.create({
      data: { name: 'Q4 2025', type: 'quarter', tenantId: tenant.id },
    }),
  ]);

  // Create Templates
  const templates = await Promise.all([
    // 1. General Project
    prisma.template.create({
      data: {
        name: 'Standard Project Scoring',
        assetType: 'project',
        description: 'General purpose project evaluation framework',
        dimensions: [
          { name: 'Feasibility', weight: 40, key: 'feasibility' },
          { name: 'ROI', weight: 60, key: 'roi' },
        ],
        inputSchema: {
          type: 'object',
          properties: {
            project_manager: { type: 'string', title: 'Project Manager' },
            budget: { type: 'number', title: 'Budget ($)' },
            deadline: { type: 'string', format: 'date', title: 'Target Deadline' }
          },
          required: ['budget']
        },
        tenantId: tenant.id,
      },
    }),

    // 2. Startup Idea Validator
    prisma.template.create({
        data: {
            name: 'Startup Idea Validator',
            assetType: 'startup',
            description: 'Evaluate early-stage startup ideas for viability and potential',
            dimensions: [
                { name: 'Market Need', weight: 30, key: 'market_need' },
                { name: 'Solution Viability', weight: 30, key: 'solution_viability' },
                { name: 'Business Model', weight: 20, key: 'business_model' },
                { name: 'Competitive Edge', weight: 20, key: 'competitive_edge' }
            ],
            inputSchema: {
                type: 'object',
                properties: {
                    problem: { type: 'string', title: 'Problem Statement', description: 'What pain point are you solving?', format: 'textarea' },
                    target_audience: { type: 'string', title: 'Target Audience', description: 'Who are your ideal customers?' },
                    solution: { type: 'string', title: 'Proposed Solution', description: 'How does your product solve the problem?', format: 'textarea' },
                    revenue_model: { type: 'string', title: 'Revenue Model', enum: ['Subscription', 'One-time', 'Ads', 'Freemium'], default: 'Subscription' }
                },
                required: ['problem', 'target_audience', 'solution']
            },
            tenantId: tenant.id
        }
    }),

    // 3. Real Estate Investment
    prisma.template.create({
        data: {
            name: 'Real Estate Investment',
            assetType: 'real_estate',
            description: 'Analyze rental properties for cash flow and appreciation',
            dimensions: [
                { name: 'Cash Flow', weight: 40, key: 'cash_flow' },
                { name: 'Appreciation Potential', weight: 30, key: 'appreciation' },
                { name: 'Location Quality', weight: 20, key: 'location' },
                { name: 'Condition Risk', weight: 10, key: 'condition' }
            ],
            inputSchema: {
                type: 'object',
                properties: {
                    address: { type: 'string', title: 'Property Address' },
                    property_type: { type: 'string', title: 'Property Type', enum: ['Single Family', 'Multi Family', 'Condo', 'Commercial'] },
                    purchase_price: { type: 'number', title: 'Purchase Price ($)' },
                    monthly_rent: { type: 'number', title: 'Expected Monthly Rent ($)' },
                    monthly_expenses: { type: 'number', title: 'Monthly Expenses ($)', description: 'Include tax, insurance, maintenance' },
                    sqft: { type: 'number', title: 'Square Footage' },
                    year_built: { type: 'number', title: 'Year Built' }
                },
                required: ['address', 'purchase_price', 'monthly_rent']
            },
            tenantId: tenant.id
        }
    }),

    // 4. SaaS Product Audit
    prisma.template.create({
        data: {
            name: 'SaaS Product Audit',
            assetType: 'saas',
            description: 'Technical and business health check for SaaS products',
            dimensions: [
                { name: 'Product Market Fit', weight: 35, key: 'pmf' },
                { name: 'Technical Health', weight: 25, key: 'tech_health' },
                { name: 'Growth Metrics', weight: 25, key: 'growth' },
                { name: 'UX/UI Quality', weight: 15, key: 'ux' }
            ],
            inputSchema: {
                type: 'object',
                properties: {
                    stage: { type: 'string', title: 'Growth Stage', enum: ['MVP', 'Early Traction', 'Scaling', 'Mature'] },
                    tech_stack: { type: 'string', title: 'Tech Stack', description: 'e.g. React, Node, AWS' },
                    mrr: { type: 'number', title: 'Monthly Recurring Revenue ($)' },
                    churn_rate: { type: 'number', title: 'Monthly Churn Rate (%)' },
                    active_users: { type: 'number', title: 'Active Users (MAU)' },
                    key_features: { type: 'string', title: 'Key Features List', format: 'textarea' }
                },
                required: ['stage', 'tech_stack']
            },
            tenantId: tenant.id
        }
    })
  ]);

  // Create system tenant for system prompts
  const systemTenant = await prisma.tenant.upsert({
    where: { id: 'system-tenant-id' },
    update: {},
    create: {
      id: 'system-tenant-id',
      name: 'System',
      plan: 'system',
      status: 'active',
    },
  });

  // Create system prompts (available to all tenants)
  const systemPrompts = await Promise.all([
    prisma.prompt.upsert({
      where: {
        tenantId_name_version: {
          tenantId: systemTenant.id,
          name: 'Website Expert',
          version: 1,
        },
      },
      update: {},
      create: {
        tenantId: systemTenant.id,
        name: 'Website Expert',
        version: 1,
        content: `你是一位网站体验专家，专注于：
- 信息架构和导航设计
- 可用性和用户体验
- 性能和加载速度
- 可访问性（WCAG 标准）
- 内容清晰度和SEO优化`,
        assetType: 'website',
        expertRole: 'website_expert',
        isActive: true,
        isSystem: true,
      },
    }),
    prisma.prompt.upsert({
      where: {
        tenantId_name_version: {
          tenantId: systemTenant.id,
          name: 'Mobile Growth Expert',
          version: 1,
        },
      },
      update: {},
      create: {
        tenantId: systemTenant.id,
        name: 'Mobile Growth Expert',
        version: 1,
        content: `你是一位移动增长专家，专注于：
- 用户激活、留存和召回策略
- 埋点与A/B测试
- 应用商店优化（ASO）
- 漏斗分析和队列优化`,
        assetType: 'mobile',
        expertRole: 'mobile_growth_expert',
        isActive: true,
        isSystem: true,
      },
    }),
    prisma.prompt.upsert({
      where: {
        tenantId_name_version: {
          tenantId: systemTenant.id,
          name: 'Product Strategy Advisor',
          version: 1,
        },
      },
      update: {},
      create: {
        tenantId: systemTenant.id,
        name: 'Product Strategy Advisor',
        version: 1,
        content: `你是一位产品策略顾问，专注于：
- 目标-指标-举措闭环
- 优先级框架（ICE/RICE）
- 依赖关系和风险分析
- 产品路线图规划`,
        assetType: 'product',
        expertRole: 'product_strategist',
        isActive: true,
        isSystem: true,
      },
    }),
    prisma.prompt.upsert({
      where: {
        tenantId_name_version: {
          tenantId: systemTenant.id,
          name: 'Default Expert',
          version: 1,
        },
      },
      update: {},
      create: {
        tenantId: systemTenant.id,
        name: 'Default Expert',
        version: 1,
        content: `你是一位专业的资产评估专家，专注于：
- 多维度综合评估
- 数据驱动的分析
- 可执行的改进建议
- 风险识别和缓解策略`,
        assetType: 'custom',
        isActive: true,
        isSystem: true,
      },
    }),
  ]);

  console.log({ admin, tenant, assets, tags, templates, systemPrompts });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

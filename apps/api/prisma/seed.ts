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
  const template = await prisma.template.create({
    data: {
      name: 'Standard Project Scoring',
      assetType: 'project',
      dimensions: [
        { name: 'Feasibility', weight: 40 },
        { name: 'ROI', weight: 60 },
      ],
      tenantId: tenant.id,
    },
  });

  console.log({ admin, tenant, assets, tags, template });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

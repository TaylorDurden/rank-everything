# Asset Rating Platform

Asset Rating Platform (多资产评级平台) 是一个基于 Turborepo 现代 Monorepo 架构构建的全栈项目。

## 📖 快速文档链接

- **[开发指南 (中文)](./DEVELOPMENT_GUIDE_ZH.md)**: 包含了如何安装、运行、构建以及前后端开发的详细说明。
- **[项目 Blueprint (设计蓝图)](./prompt/README.md)**: 查看项目的初衷、愿景及核心设计思路。
- **[需求与架构文档](./prompt/docs/)**: 获取数据模型、API 设计、AI 分析流程等详细文档。

## 🚀 快速启动

```bash
# 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 安装依赖
pnpm install

# 启动开发环境 (Next.js + NestJS)
pnpm dev
```

- 前端: `http://localhost:3001`
- 后端: `http://localhost:3000`

## 🏗️ 核心架构

- **Apps**: `Next.js` (Web) & `NestJS` (API)
- **Packages**: 共享 UI、API 类型及配置
- **Infrastructure**: Turborepo & pnpm Workspaces

# Asset Rating Platform (Blueprint)

This repository bootstraps the architecture, prompt system, and code scaffold for a multi-asset rating platform. It is documentation-first and uses a modern monorepo stack: Turborepo + pnpm, Next.js + Tailwind + shadcn-ready frontend, NestJS backend.

## What’s inside
- `docs/` — requirements, architecture, data model, AI prompts, event flows, MVP.
- `apps/web` — Next.js (App Router, TS), Tailwind 3, shadcn-ready config, alias `@repo/web`.
- `apps/api` — NestJS (TS, strict), alias `@repo/api`.
- `services/` — placeholder for future split services.
- `pnpm-workspace.yaml` / `turbo.json` — monorepo orchestration.

## How to use this repo
1) Install dependencies (pnpm + local store paths suggested):
   - `PNPM_HOME=$(pwd)/.pnpm-home PNPM_STORE_PATH=$(pwd)/.pnpm-store pnpm install`
2) Develop:
   - `pnpm dev` (runs Next and Nest in parallel via Turbo)
   - `pnpm lint` / `pnpm build`
3) Frontend (apps/web):
   - Tailwind 3 configured; shadcn ready via `components.json` and `src/lib/utils.ts`.
   - Add components with `pnpm dlx shadcn@latest add button` (or other components).
4) Backend (apps/api):
   - Standard NestJS project; start with `pnpm --filter @repo/api start:dev`.
5) Roadmap:
   - Implement evaluation → AI分析 → 报告链路；接入 RBAC、数据源采集、通知。

## Status
Docs + monorepo scaffold complete. Implement domain modules next (assets, evaluations, AI analysis, reports) per `docs/`.


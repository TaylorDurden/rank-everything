# Asset Rating Platform (Blueprint)

This repository bootstraps the architecture, prompt system, and code scaffold for a multi-asset rating platform. It is documentation-first and uses a modern monorepo stack: Turborepo + pnpm, Next.js + Tailwind + shadcn-ready frontend, NestJS backend.

## What’s inside
- `prompt/docs/` — requirements, architecture, data model, AI prompts, event flows, MVP.
- `apps/web` — Next.js (App Router, TS), Tailwind 3, shadcn-ready config, alias `@repo/web`.
- `apps/api` — NestJS (TS, strict), alias `@repo/api`.
- `services/` — placeholder for future split services.
- `pnpm-workspace.yaml` / `turbo.json` — monorepo orchestration.

## Status
Docs + monorepo scaffold complete. Implement domain modules next (assets, evaluations, AI analysis, reports) per `docs/`.


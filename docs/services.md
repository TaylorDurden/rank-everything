# Services Skeleton

Code to be added here. Suggested layout:
- `gateway/` — ingress, authN, rate limiting
- `users/` — accounts, tenants, RBAC
- `assets/` — asset metadata, tags, relations
- `evaluations/` — evaluation lifecycle, templates, data intake
- `ai-analysis/` — prompt library, model routing, validation
- `reports/` — rendering and exports
- `notifications/` — email/push/webhooks
- `files/` — object storage proxy

Pick the initial stack (e.g., TypeScript/Nest/Fastify) and scaffold per service when ready. Use a message bus for events defined in `docs/event-flows.md`.


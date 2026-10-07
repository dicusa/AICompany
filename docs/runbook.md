# Operations runbook

## Deploy

Set `DATABASE_URL`, `JWT_SECRET` (32+ random characters), `WEB_ORIGIN` and `NODE_ENV=production` through the deployment secret manager. Build the image, run `npm run db:migrate` as a one-off migration job, then deploy API and web services behind TLS. Use a non-superuser database role with least privilege; RLS is not a boundary against superusers or `BYPASSRLS` roles. Configure managed PostgreSQL backups and validate a restore before launch.

## Health and incidents

Probe `/health`. A 503 indicates the API cannot reach PostgreSQL; check database health, pool saturation and network configuration. For authentication incidents rotate `JWT_SECRET` to revoke existing sessions. For suspected tenant exposure, restrict API traffic, preserve request IDs and database audit logs, assess affected tenant IDs, and follow the company's incident response process. Restore from a verified backup only after preserving evidence.

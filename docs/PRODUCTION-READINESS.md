# Production readiness

This document separates local/demo conveniences from production requirements. Do not deploy a setting labelled demo-only to a public environment.

## Production baseline

- Use a managed MongoDB deployment with a dedicated least-privilege application user, IP/network access restrictions, backups, and monitoring.
- Store `MONGO_URI`, `JWT_SECRET`, SMTP credentials, and deployment URLs only in the hosting provider's encrypted environment-variable store. Never commit `.env` files or connection strings.
- Generate a unique, high-entropy `JWT_SECRET` per environment. Rotate it if it is exposed; rotation invalidates existing sessions.
- Set `CLIENT_URL` to the exact production frontend origin. Multiple approved origins can be comma-separated for controlled previews.
- Enable `REQUIRE_EMAIL_VERIFICATION=true` and `DIRECT_PASSWORD_RESET=false`.
- Configure an SMTP provider and a verified `MAIL_FROM` domain. Test verification and password-reset email delivery after every deployment.
- Serve the frontend and API over HTTPS. Configure the platform to redirect HTTP to HTTPS.
- Restrict upload sizes/types at the edge or storage provider and move persistent user uploads to object storage before relying on horizontally scaled API instances.
- Configure database indexes, uptime checks for `/health`, application logs, alerting, and backup/restore exercises.

## Demo-only behavior

| Setting or behavior | Demo use | Production setting |
| --- | --- | --- |
| Email verification | Can be disabled to simplify a local demo | Enable it before public registration |
| Direct password reset token in API response | Convenient for local testing only | Keep disabled; send a reset link by email |
| Local MongoDB URL | Suitable for local development | Use a managed, access-controlled database |
| Local upload directory | Suitable for a single local process | Use object storage or a durable shared volume |
| Broad localhost access | Useful during development | Allow only explicit frontend origins |

## Controls included in this repository

- JWT-protected routes and password hashing
- Request-body limit, CORS allowlist, safe JSON error responses, and HTTP security headers
- `/health` endpoint for deployment health checks
- CI runs backend tests/checks plus frontend tests/build on pull requests and pushes to `ft-dev` or `master`

## Current hosted configuration

The checked-in Render blueprint has email verification disabled so registration and login continue to work until an SMTP provider is configured. Before opening registration to the public, add working SMTP credentials in Render and set `REQUIRE_EMAIL_VERIFICATION=true`.

## Pre-release checklist

1. Confirm CI is green and review the deployment environment variables.
2. Verify registration, verification email, login, reset email, itinerary creation, and a protected API request in the production-like environment.
3. Confirm CORS rejects unapproved browser origins and health checks return `200`.
4. Confirm no secrets, exported user data, or real credentials exist in the branch history or deployment logs.
5. Create and verify a database backup before schema or data migrations.

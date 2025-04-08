## Project overview

We are building a tool to manage an email list based on a Wordpress blog.

It is a Next.js app that manages subscribers in a MySQL database. It queries the Wordpress JSON API for my blog to retrieve post content, and formats it for email delivery with Sendgrid.

## Conventions

- Use zod to validate API responses match our expected types
- Prefer throwing errors to providing fallbacks. Include useful context to make the error easy to identify.

## Repo structure

- `/apps/email-list/` - the workspace for this project
- `/apps/email-list/src/app/` - Next.js pages and API routes
- `/apps/email-list/src/db/` - DB schema and migrations
- `/apps/email-list/src/repositories/` - repository classes for interacting with DB
- `/apps/email-list/src/services/` - domain logic split into sensible services
- `/apps/email-list/src/types/` - shared types and zod schemas

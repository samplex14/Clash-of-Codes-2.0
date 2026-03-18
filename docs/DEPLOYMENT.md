# Deployment Guide

## 1. Prepare Neon

1. Create Neon project and database.
2. Copy pooled URL for runtime DATABASE_URL.
3. Copy direct URL for migration DIRECT_URL.

## 2. Configure Environment Variables

In Vercel project settings, add:

- DATABASE_URL = pooled Neon URL
- DIRECT_URL = direct Neon URL
- NEXT_PUBLIC_APP_URL = production app URL
- NODE_ENV = production

## 3. Apply Migrations

Run from CI or local machine:

- npx prisma migrate deploy
- npm run db:generate

## 4. Connect Repository

1. Push to GitHub.
2. Import project in Vercel.
3. Framework: Next.js.

vercel.json already configures:

- installCommand: npm install
- buildCommand: prisma generate && next build

## 5. Deploy

Trigger deployment from Vercel dashboard or push to main branch.

## 6. Post-Deploy Validation

1. Register two participants.
2. Verify matchmaking and polling transitions on /arena.
3. Start battle from versus button.
4. Submit from both clients and ensure redirect to /leaderboard.

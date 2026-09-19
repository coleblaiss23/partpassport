# Part Passport

Tamper-evident lifecycle records for aircraft parts. Each event is hash-chained and signed with the issuing organization's Ed25519 key. Private keys never reach the server.

## Setup
```bash
cp .env.example .env        # fill DATABASE_URL (Postgres), ADMIN_TOKEN (32+ random chars), ANTHROPIC_API_KEY
npm install
npx prisma migrate dev --name init
npm run dev
```

## Onboard an organization (permissioned network)
```bash
npm run org:create -- "Acme MRO"     # prints API key + private key ONCE
```

## Test
```bash
npm run test:run     # unit tests (no database needed)
npm run typecheck
npm run test:e2e     # live smoke test; needs `npm run dev` running
```

## Flow
1. `POST /api/parts/prepare` (Bearer API key) returns a draft to sign.
2. Sign `{partId,eventHash,timestamp}` with your private key (the dashboard does this in the browser).
3. `POST /api/parts` with `{draft, signature}`. Events use `/api/parts/[id]/events/prepare` then `/api/parts/[id]/events`.
4. Anyone can verify at `/verify/<partNumber>/<serial>` or `GET /api/verify/<partNumber>/<serial>`.

Pages: `/dashboard/check` (AI certificate audit, shareable `/report/[id]`), `/dashboard/parts/new`, `/dashboard/events/new`.
Import AD/SDR data: `npm run flags:import -- flags.csv`.

This system reports whether records are consistent. It never determines airworthiness.

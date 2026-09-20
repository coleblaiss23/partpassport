# PartPassport

Release certificate review and tamper-evident lifecycle records for aircraft parts.

- **Certificate check:** reads FAA 8130-3 and EASA Form 1 PDFs, applies deterministic checks (signature, dates, serial consistency), and matches part numbers against imported safety data.
- **Part passports:** every event is hash-chained and signed with the recording organization's Ed25519 key. Private keys are used in the browser only and are never stored on the server.
- **Public verification:** anyone can look up a part number and serial and re-verify the whole chain.

## Stack

Next.js (App Router), TypeScript, Prisma, PostgreSQL, Tailwind CSS.

## Getting started

```bash
cp .env.example .env      # fill DATABASE_URL, ADMIN_TOKEN, SESSION_SECRET (openssl rand -hex 32)
npm install
npx prisma migrate dev
npm run seed:demo         # optional demo organizations and parts
npm run dev
```

Create an organization: `npm run org:create -- "Company name" [PILOT|PRO|ENTERPRISE]`.

## Quality gates

```bash
npm run check             # lint, typecheck, unit tests
npm run doctor            # environment and database health
npm run smoke             # route health against a running server
npm run test:e2e          # end-to-end flow against a running server and database
```

CI runs lint, typecheck, tests and a production build on every push.

## Load testing

```bash
npm run seed:bulk -- 20000 3
DISABLE_RATE_LIMIT=1 npm run dev
npm run loadtest -- --c 20 --s 15
```

## Security notes

- Organization creation requires `ADMIN_TOKEN`.
- Browser sessions use a signed, HTTP-only, same-site cookie; API keys are stored hashed and can be revoked.
- Plan limits and rate limits are enforced server-side. Set the Upstash variables for limits shared across instances.
- Never enable `AI_MODE=mock` or `DISABLE_RATE_LIMIT` in production. `npm run doctor` flags both.
- The terms and privacy pages are drafts. Have counsel review them before charging customers.

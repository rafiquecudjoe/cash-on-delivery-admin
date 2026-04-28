# Cash on Delivery — Admin

Next.js 16 (App Router) + Tailwind 4 + shadcn (base-ui) + TanStack Query + Zustand auth.

## Local dev

```bash
cp .env.example .env.local
# point NEXT_PUBLIC_API_URL at the running NestJS API (default http://localhost:3000)
npm install
npm run dev   # http://localhost:3001 (or set PORT)
```

The API must be running for login + data calls to work.

## Build

```bash
npm run build && npm start
```

## Docker

```bash
docker build -t cod-admin .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.cashondeliverygh.com cod-admin
```

## Architecture notes

- Auth state lives in `stores/auth.ts` (Zustand). `accessToken` in memory; `refreshToken` in `localStorage`.
- `lib/api.ts` axios instance — request interceptor injects `Authorization`, response interceptor refreshes on 401 once and retries.
- All dashboard pages are client components driven by TanStack Query.
- Forms = React Hook Form + Zod resolver.

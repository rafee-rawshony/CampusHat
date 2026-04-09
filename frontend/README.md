# CampusHat Frontend

Frontend application for CampusHat, built with Next.js App Router, TypeScript, React Query, Zustand, and Tailwind CSS.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack React Query (server state)
- Zustand (client auth/cart/campus/admin state)
- Axios API client with cookie-based refresh flow

## Prerequisites

- Node.js 18+
- npm 9+
- Backend running locally (default: http://localhost:8000)

## Environment Variables

Create or update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Legacy aliases kept temporarily for backward compatibility.
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000
```

Notes:

- `NEXT_PUBLIC_API_URL` is the primary API base and should point to `/api/v1`.
- `NEXT_PUBLIC_WS_URL` is used for websocket-capable features.
- Avoid hardcoding localhost in components; consume env through shared client helpers.

## Install and Run

From `frontend/`:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - lint all frontend files

## API Strategy

All API requests should go through `src/lib/api.ts`.

- Shared axios instance: `api`
- Auth handling: request token attach + 401 refresh interceptor
- Shared response helpers:
	- `unwrapApiData<T>(payload, fallback)`
	- `extractArray<T>(payload)`
	- `extractPaginatedArray<T>(payload)`

These helpers normalize backend envelope formats and reduce per-page parsing drift.

## Backend Route Conventions

Given `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`, frontend paths should generally be relative to `/api/v1`.

Examples:

- `api.get('/auth/me/update/')`
- `api.get('/wallet/balance/')`
- `api.get('/admin/dashboard/')`
- `api.get('/sellers/my-dashboard/')`
- `api.get('/analytics/seller/overview/')`

Health endpoint is outside v1 and should use origin + `/api/health/`.

## Validation Gates

After endpoint or contract changes, run:

```bash
npx eslint src/app/page.tsx src/app/account/orders/page.tsx src/app/seller/page.tsx src/components/layout/AnnouncementBar.tsx src/lib/api.ts
```

Recommended smoke checks:

- Home: `/`
- Account: `/account`, `/account/orders`, `/account/listings`
- Seller: `/seller`, `/seller/dashboard`, `/seller/orders`, `/seller/wallet`, `/seller/apply`
- Admin: `/admin`

## Troubleshooting

- If API requests fail unexpectedly, verify `NEXT_PUBLIC_API_URL` in `.env.local`.
- If auth loops to login, check backend refresh endpoint and cookie settings.
- If status bar shows disconnected, confirm backend health is reachable at `/api/health/` on the backend origin.

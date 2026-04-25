# Services Layer

This folder holds the **frontend API service layer**. Every backend endpoint the
app calls should live here in a domain-specific `*.service.ts` file.

## Why this exists

Before: API calls were inlined across 50+ components, e.g.
`api.post('/auth/login/', data)` inside a page file. If the backend changed a
URL, you had to hunt every file.

Now: one file per domain, typed inputs and outputs, single source of truth.

## Layout

```
lib/api.ts           ← low-level axios instance (base URL, auth interceptor)
services/
  auth.service.ts    ← login, register, OTP, logout, me
  cart.service.ts    ← cart add/update/remove
  orders.service.ts  ← checkout, order list, tracking
```

## How to use

```ts
// ❌ Avoid inline calls in components
await api.post('/auth/login/', { email, password })

// ✅ Use the service
import { login } from '@/services/auth.service'
const { user, access_token } = await login({ email, password })
```

## Adding a new domain

Create `services/<domain>.service.ts`. Keep the file flat — named exports, one
function per endpoint. Wrap URLs/payloads only, do not mix UI logic.

# PRMS API Specification

Base URL: `${NEXT_PUBLIC_API_URL}` (local: `http://localhost:4000`)

All routes except `register`, `login`, and `reset-password` require:

```
Authorization: Bearer <supabase_access_token>
```

Errors are returned as `{ "error": "<message>" }` with the appropriate HTTP
status (400 validation, 401 unauthenticated, 403 forbidden, 404 not found,
409 conflict, 500 server error).

## Auth

| Method | Path | Roles | Notes |
| ------ | ---- | ----- | ----- |
| POST | `/api/auth/register` | public | `{ name, email, password }` → creates a tenant |
| POST | `/api/auth/login` | public | `{ email, password }` → `{ access_token, refresh_token, user }` |
| POST | `/api/auth/logout` | any | client clears its session |
| POST | `/api/auth/reset-password` | public | `{ email }` → sends Supabase reset email |
| GET | `/api/auth/me` | any | returns the `public.users` row |
| PUT | `/api/auth/users/:id/role` | admin | `{ role }` |

## Properties

| Method | Path | Roles | Notes |
| ------ | ---- | ----- | ----- |
| GET | `/api/properties` | admin, manager | admin: all; manager: own only. Query: `status`, `search` |
| GET | `/api/properties/:id` | admin, manager, tenant | tenant only if leasing it |
| POST | `/api/properties` | admin, manager | manager forced to own `manager_id` |
| PUT | `/api/properties/:id` | admin, assigned manager | |
| DELETE | `/api/properties/:id` | admin | |

## Tenants

| Method | Path | Roles | Notes |
| ------ | ---- | ----- | ----- |
| GET | `/api/tenants` | admin, manager | |
| GET | `/api/tenants/:id` | admin, manager, self | |
| POST | `/api/tenants` | admin, manager | |
| PUT | `/api/tenants/:id` | admin, manager, self | self limited to name/phone |
| DELETE | `/api/tenants/:id` | admin | 409 if active agreement |

## Agreements

| Method | Path | Roles | Notes |
| ------ | ---- | ----- | ----- |
| GET | `/api/agreements` | admin, manager, tenant | scoped by role |
| POST | `/api/agreements` | admin, manager | 409 if property not vacant |
| PUT | `/api/agreements/:id/renew` | admin, manager | `{ end_date }` → old expired, new active |
| PUT | `/api/agreements/:id/terminate` | admin, manager | property → vacant |

## Payments

| Method | Path | Roles | Notes |
| ------ | ---- | ----- | ----- |
| GET | `/api/payments?agreementId=` | admin, manager, tenant | scoped by role |
| POST | `/api/payments` | admin, manager | |
| PUT | `/api/payments/:id` | admin, manager | mark paid |
| GET | `/api/payments/summary?month=&year=` | admin, manager | totals by status |

## Dashboard

| Method | Path | Roles | Notes |
| ------ | ---- | ----- | ----- |
| GET | `/api/dashboard/admin` | admin | KPIs + occupancy + revenue series |
| GET | `/api/dashboard/manager` | manager | KPIs + collected/due series |
| GET | `/api/dashboard/tenant` | tenant | lease + next payment + history |

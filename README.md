# Employee Admin Dashboard

A React + Vite + TypeScript admin dashboard for the
[Employee GraphQL API](../laravel-code-test). It provides login, a paginated
employees table, view/edit/delete, Excel bulk-import, and Excel export — all
talking to the Laravel backend over GraphQL (plus one REST endpoint for the
binary export).

## Stack

- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **React Router v7**
- **TanStack Query v5** for fetching/caching/loading state
- A small **fetch-based GraphQL client** (no Apollo) so the multipart upload and
  authenticated binary download are easy to control

## Prerequisites

- **Node 20.19+ or 22.0+** (Vite 6). Tested on Node 22.
- The **backend running** at `http://localhost:8000` (see its README):
  - `php artisan serve`
  - `php artisan queue:work` — **required** for the import feature to be applied
- Default login: **admin / password**

## Setup

```bash
npm install
cp .env.example .env   # defaults work for local dev
npm run dev            # http://localhost:5173
```

Open http://localhost:5173 and sign in with `admin` / `password`.

## Environment

| Variable | Purpose | Dev default |
|---|---|---|
| `VITE_API_URL` | Base URL of the API. **Leave empty in dev** so requests are relative (`/api/...`) and go through the Vite proxy (no CORS). Set to the backend's absolute origin in production. | _(empty)_ |
| `VITE_PROXY_TARGET` | Backend origin the Vite dev server proxies `/api` to. | `http://localhost:8000` |

### Networking: dev proxy vs production CORS

In development, [vite.config.ts](vite.config.ts) proxies `/api` to the backend
(both `/api/graphql` and `/api/employees/export`), so the browser only ever
makes same-origin requests — **no CORS needed**.

In production you'd typically:
1. Set `VITE_API_URL` to the backend origin (e.g. `https://api.example.com`), and
2. Enable CORS on the backend. Since everything lives under `/api`, Laravel's
   default CORS config (`'paths' => ['api/*']`) already covers it — no extra
   config needed.

## Features

| Screen / action | Notes |
|---|---|
| **Login** | `login` mutation → token stored in `localStorage`; auth errors shown inline. |
| **Route protection** | Unauthenticated users are redirected to `/login`. An `Unauthenticated` response from any request clears the token and redirects (global handler). |
| **Employees table** | Paginated (`first`/`page`), page-size selector (10/25/50/100), shows `paginatorInfo.total`, with loading / empty / error states. |
| **View / Edit / Delete** | Row actions. Edit is a partial `updateEmployee` with **inline field validation** (including duplicate-email). Delete is confirm-guarded. |
| **Import** | `.xlsx/.xls/.csv` upload via the GraphQL multipart spec. **Async** — processed on the backend queue worker (existing emails are updated, new emails created). Shows a real **upload progress bar**, then polls `importStatus` for a live **processing progress bar** (rows done / total), and auto-refreshes the list on completion. |
| **Export** | Authenticated blob download of `employees.xlsx` (fetched with the Bearer header, not a plain link). Streams the response so it can show a **download progress bar** (indeterminate while the backend generates the sheet, then a real %). |

## How it talks to the backend

- **GraphQL** (`POST /api/graphql`) for everything except export, via
  [`gqlRequest` / `gqlUpload`](src/lib/graphql.ts). The Bearer token is attached
  automatically.
- **Validation errors**: the backend returns
  `errors[].extensions.validation`; the client strips Lighthouse's `input.`
  prefix (from `@spread` inputs) so messages map to the right form field.
- **Auth failures**: `me` returns `null` when unauthenticated; guarded
  operations return a GraphQL error `"Unauthenticated."` at HTTP 200, while the
  REST export returns a real HTTP 401. Both are funneled into a single global
  logout.
- **Export** (`GET /api/employees/export`) is REST because GraphQL can't return
  a binary body.

## Scripts

```bash
npm run dev       # start dev server (with backend proxy)
npm run build     # typecheck + production build
npm run preview   # preview the production build
npm run lint      # eslint
```

## Project structure

```
src/
  lib/          graphql client, operations, query client, formatting
  auth/         AuthContext (token + me bootstrap), ProtectedRoute
  hooks/        useEmployees, useEmployeeMutations, useImportEmployees
  components/   Layout, Sidebar, Topbar, ui/ (Button, Field, Modal, Toast, …)
  features/employees/  table, pagination, view/edit/delete/import/export
  pages/        LoginPage, EmployeesPage
```

## Notes

- The token is stored in `localStorage` for simplicity. That carries the usual
  XSS trade-off; a production app may prefer an httpOnly cookie flow.
- Import only takes effect while the backend `php artisan queue:work` is
  running. If a refresh shows no changes, check the worker.

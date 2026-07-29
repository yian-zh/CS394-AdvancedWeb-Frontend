# 1 Million Rows Readiness Audit Prompt

> **Purpose:** Drop this prompt into any AI (DeepSeek, Claude, GPT, etc.). It instructs the AI to systematically explore a codebase and produce a scored audit of whether it can handle 1 million rows of data.
>
> **Usage:** Replace `{PROJECT_PATH}` or ask the AI to auto-detect the workspace root. The prompt is stack-agnostic.

---

## Instructions for the AI

You are a performance auditor. Your task is to inspect the codebase at `{PROJECT_PATH}` (or the current workspace root) and produce a **1 Million Rows Readiness Report**.

### Phase 1: Understand the System

Before scoring, answer these foundational questions:

1. **Architecture:** Is this a monolith, SPA + API, SSR app, mobile app, CLI tool, or data pipeline? Identify the frontend framework, backend framework, and database.
2. **Database Layer:** What database(s) are used? (PostgreSQL, MySQL, MongoDB, SQLite, etc.) Is there an ORM or raw queries? Are there migrations or seed files?
3. **Data Flow:** How does data travel from the database to the end user? Trace the full path: DB → API/query → serialization → network → client rendering.
4. **Row Definition:** What entity constitutes a "row"? (e.g., users, orders, log entries, products). Identify the largest tables/collections likely to reach 1M rows.

### Phase 2: Audit Checklist (Score Each Item)

For each category below, assign a score: **PASS**, **WARN**, or **FAIL**. Provide file paths and line numbers as evidence.

---

#### A. DATABASE & API LAYER

| # | Check | What to Look For |
|---|---|---|
| A1 | **Pagination is server-side** | API endpoints accept `page`/`limit`/`cursor` params. No `SELECT *` without `LIMIT`. Check for `OFFSET`-based vs `keyset/cursor` pagination (cursor is better for 1M+). |
| A2 | **Indexes on queried columns** | Tables have indexes on columns used in `WHERE`, `ORDER BY`, `JOIN`, and pagination sort keys. Composite indexes where multi-column queries exist. Check migration files or schema files. |
| A3 | **No N+1 queries** | Check if list endpoints issue one query per row (e.g., loading relations in a loop). Look for eager loading (`include`, `with`, `joins`, `preload`, `.populate()`). |
| A4 | **Query timeouts & connection pooling** | Database connections use a pool with reasonable limits. Queries have timeouts. No unbounded connection creation. |
| A5 | **Aggregations use DB, not app code** | COUNTs, SUMs, AVGs happen in SQL/aggregation pipelines, not by fetching all rows and reducing in application code. |
| A6 | **Bulk operations exist** | Batch inserts, batch updates, or bulk deletes for operations affecting many rows. No row-by-row insert/update in loops. |
| A7 | **No loading all rows for dropdowns/filters** | Check if any page loads `perPage: 9999` or similar to populate dropdowns. This is a red flag for 1M rows. |
| A8 | **Rate limiting & throttling** | API has rate limiting, request size limits, and response size limits to prevent accidental full-table scans. |

#### B. DATA FETCHING & STATE (FRONTEND)

| # | Check | What to Look For |
|---|---|---|
| B1 | **Server-state library with caching** | Uses TanStack Query, SWR, Apollo Client, RTK Query, or similar. Has appropriate `staleTime`/`cacheTime` settings. |
| B2 | **Pagination state is URL-driven or persistent** | Page number is in URL search params (shareable, back-button-friendly) or at minimum kept in component state with proper reset on filter change. |
| B3 | **Search/filter is server-side** | Search queries are sent to the API as query params, not filtered client-side from a single page of results. Client-side filtering across 1M rows is impossible without the full dataset. |
| B4 | **Request deduplication** | Multiple identical API calls are deduplicated (TanStack Query does this by default; manual fetch does not). |
| B5 | **Optimistic updates or background refetch** | Mutations use optimistic updates or invalidate-then-refetch, not full page reloads. |
| B6 | **No waterfall requests** | Parallel data dependencies are fetched concurrently (e.g., `Promise.all` or `useQueries`), not sequentially chained. |

#### C. RENDERING PERFORMANCE (FRONTEND)

| # | Check | What to Look For |
|---|---|---|
| C1 | **Virtualization / Windowing** | Tables or lists use `@tanstack/react-virtual`, `react-window`, `react-virtuoso`, or native virtual scrolling. Only visible rows are rendered in DOM. |
| C2 | **Pagination UI works up to 100K+ pages** | Pagination component handles `lastPage: 100000` gracefully (not rendering 100K page buttons). Uses ellipsis or input-based page jumping. |
| C3 | **Images are lazy-loaded** | Large images use `loading="lazy"`, proper dimensions, and modern formats (WebP). No 750KB PNGs loaded upfront. |
| C4 | **No uncontrolled re-renders** | Check for missing `key` props, inline object/array/function props causing re-renders, proper `useMemo`/`useCallback` usage. |
| C5 | **Debounced search inputs** | Search inputs debounce (300-500ms) before triggering API calls. No API call per keystroke. |
| C6 | **Loading/empty/error states for every view** | Every data view handles all three states. No blank screens or uncaught promise rejections when API returns 10K or 0 results. |

#### D. BUNDLE & ASSET OPTIMIZATION

| # | Check | What to Look For |
|---|---|---|
| D1 | **Code splitting** | Routes use dynamic imports (`React.lazy`, `import()`) or framework-level code splitting (Next.js route-based splitting). Heavy libraries (maps, charts, rich text editors) are lazy-loaded. |
| D2 | **Vendor chunking** | Build config separates vendor bundles (react, router, UI lib, maps) from app code. Check Vite `manualChunks`, webpack `splitChunks`, etc. |
| D3 | **Tree shaking** | Imports are specific (e.g., `import { format } from 'date-fns'` not `import * as dateFns`). No unused imports/deps. |
| D4 | **Asset optimization** | Images are compressed. Fonts are subsetted or use `font-display: swap`. No render-blocking CSS/JS. |
| D5 | **Bundle size** | Main JS bundle < 200 KB gzipped. Total initial load < 500 KB. Check build output (`dist/`, `.next/`, etc.). |

#### E. INFRASTRUCTURE & OPERATIONS

| # | Check | What to Look For |
|---|---|---|
| E1 | **Database read replicas** | Read-heavy endpoints use replicas. Write operations go to primary. (Check config/env files for connection strings.) |
| E2 | **Caching layer** | Redis/Memcached or CDN caching for frequently-accessed, slowly-changing data. API responses may have `Cache-Control` headers. |
| E3 | **Horizontal scaling** | App is stateless (can run multiple instances). Session state is in a shared store (Redis, DB), not in-memory. |
| E4 | **Logging & monitoring** | Structured logging, error tracking (Sentry, DataDog), query performance monitoring (pg_stat_statements, slow query log). |
| E5 | **Backup & recovery** | Evidence of backup strategy for the database. |
| E6 | **Load testing experience** | Any load test scripts (k6, Artillery, Locust, JMeter) or CI performance budgets. |

---

### Phase 3: Produce the Report

Structure your output like this:

```markdown
# 1 Million Rows Readiness Report
**Project:** {project_name}
**Date:** {date}
**Overall Score:** X/30 PASS | Y Warn | Z Fail

---

## Summary Verdict
[2-3 sentences: Is this codebase ready? What are the 1-3 biggest risks?]

---

## Category Scores

### A. Database & API Layer (X/8 PASS)
[Table of each check with PASS/WARN/FAIL, evidence file:line, and a 1-line recommendation]

### B. Data Fetching & State (X/6 PASS)
[Same format]

### C. Rendering Performance (X/6 PASS)
[Same format]

### D. Bundle & Assets (X/5 PASS)
[Same format]

### E. Infrastructure & Operations (X/5 PASS)
[Same format]

---

## Top 5 Critical Fixes Required BEFORE 1M Rows
1. [Most critical fix with file paths and concrete code change suggestion]
2. ...
5. [Least critical of the top 5]

---

## Quick Wins (Low Effort, High Impact)
- [ ] ...
- [ ] ...

---

## Estimated Effort
| Area | Hours (est.) |
|---|---|
| Database changes | Xh |
| API changes | Xh |
| Frontend changes | Xh |
| Infrastructure | Xh |
| Testing & validation | Xh |
| **Total** | **Xh** |
```

### Phase 4: Scoring Rules

- **PASS**: Evidence clearly present and well-implemented.
- **WARN**: Partially present, present but poorly implemented, or present but untested.
- **FAIL**: Missing entirely or implemented in a way that breaks at 1M rows.
- If a check is **not applicable** to this codebase (e.g., "read replicas" for a CLI tool), mark it **N/A** and note why.

Do NOT guess or assume. Every finding must cite a specific file path and line number. If you cannot find evidence for a check, mark it FAIL (not WARN) and say "No evidence found."

---

## Anti-Patterns to Flag Aggressively

Mark these as **automatic FAIL** with a bold warning:

- `SELECT * FROM table` or equivalent without LIMIT in an endpoint that returns data to the UI
- Client-side `.filter()` or `.sort()` on the full dataset (not just the current page)
- `perPage: 1000` or `limit: 10000` or similar "load everything" hack for dropdowns/filters
- Row-by-row inserts/updates in a loop (single SQL statement per row)
- Pagination component that renders a button for every page (e.g., 100,000 buttons)
- Single JS bundle > 500 KB gzipped with no code splitting
- Loading all relations without pagination (e.g., `include: { posts: true }` where user has 100K posts)

# 1M Rows Readiness — Implementation Plan

**Project:** SBMS Frontend  
**Date:** 2026-07-30  
**Goal:** Fix the top 5 critical issues blocking 1M-row scale

---

## Execution Order (by dependency + impact)

```
Phase 1: Shared Utilities   →  Phase 2: Fix Inputs    →  Phase 3: Fix Data Fetching  →  Phase 4: Performance
├── Pagination component      ├── Debounce search       ├── AsyncSelect component       ├── Code splitting
├── useDebounce hook          ├── Wire debounce         ├── Replace perPage:1000        └── Virtualization
└── (dependencies created)    └── into 5 pages            └── in 12 locations
```

---

## Phase 1: Build Shared Utilities

### 1.1 Create `useDebounce` hook

**File:** `src/hooks/useDebounce.js` (NEW)

```js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
```

### 1.2 Create shared `Pagination` component

**File:** `src/components/ui/Pagination.jsx` (NEW)

**What it does:** Replaces `Array.from({ length: lastPage }).map(...)` with an ellipsis paginator that handles 125,000+ pages without crashing.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `currentPage` | number | Active page (1-indexed) |
| `lastPage` | number | Total pages from `meta.last_page` |
| `total` | number | Total record count |
| `perPage` | number | Items per page |
| `onChange` | `(page) => void` | Page change callback |

**Behavior:**
- Always shows: `Prev | 1 | ... | current-1 | current | current+1 | ... | lastPage | Next`
- Hidden ellipsis when adjacent pages are contiguous
- "Go to page" input for jumping directly
- Shows: `Showing X to Y of Z entries`

**UI output:**
```
← Previous  1  …  4  5  [6]  7  …  125000  Next →
```
```
Showing 41 to 48 of 1,000,000 students    Go to page: [____] Jump
```

### 1.3 Create `AsyncSelect` component

**File:** `src/components/ui/AsyncSelect.jsx` (NEW)

**What it does:** Searchable dropdown that fetches options from the API on demand instead of loading all rows upfront.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `value` | string | Currently selected value |
| `onChange` | `(value) => void` | Selection handler |
| `fetchOptions` | `(search) => Promise<{id, label, sub}[]>` | Async fetcher — called with debounce |
| `placeholder` | string | Placeholder text |
| `label` | string | Field label |
| `renderOption` | `(option) => ReactNode` | Custom option renderer |
| `getOptionLabel` | `(option) => string` | How to display selected option |

**Behavior:**
- Renders a custom dropdown (not native `<select>`) with a search input
- Debounces search by 300ms before calling `fetchOptions`
- Shows loading spinner while fetching
- Shows "No results" when empty
- Click outside to close
- Keyboard accessible (arrow keys, enter, escape)

**Why not a native `<select>`:** A native `<select>` with 1M `<option>` elements would freeze the browser. We need a custom dropdown with virtualized scroll or search-then-select pattern.

---

## Phase 2: Debounce Search Inputs

### 2.1 Wire debounce into all search inputs

**Pattern (apply to each page):**

```jsx
// BEFORE
const [searchQuery, setSearchQuery] = useState('');

// AFTER
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

// Use debouncedSearch in filter logic / API call
```

**Files to modify (5 pages):**

| File | Line | Change |
|------|------|--------|
| `StudentsPage.jsx` | `38` | Add `useDebounce`, use `debouncedSearch` in `filteredStudents` memo at `226-238` |
| `UserManagementPage.jsx` | `25` | Add `useDebounce`, use `debouncedSearch` in `filteredUsers` at `92-108` |
| `FleetManagementPage.jsx` | `32` | Add `useDebounce`, use `debouncedSearch` in `filteredRepairs` at `137-146` |
| `RouteLogisticsPage.jsx` | `76` | Add `useDebounce`, use `debouncedSearch` in `filteredRoutes` at `350-359` |
| `FinancePage.jsx` | `66` | Add `useDebounce`, use `debouncedSearch` in `filteredLedger` at `231-240` |

**Each change is ~3 lines:**
```
+ import { useDebounce } from '../../../hooks/useDebounce';
  ...
  const [searchQuery, setSearchQuery] = useState('');
+ const debouncedSearch = useDebounce(searchQuery, 300);
  ...
  // Replace searchQuery with debouncedSearch in the filter useMemo
```

---

## Phase 3: Fix Pagination UI

### 3.1 Replace `Array.from({ length: lastPage })` with `<Pagination />`

**Each page has this pattern (example from `StudentsPage.jsx:768-805`):**

```jsx
// BEFORE — breaks at 125K pages
<div className="pagination-controls">
  <button ... disabled={currentPage === 1} onClick={...}>
    <ChevronLeft size={16} />
  </button>
  {Array.from({ length: studentsMeta.last_page || 1 }).map((_, idx) => (
    <button key={idx + 1} ... onClick={() => setCurrentPage(idx + 1)}>
      {idx + 1}
    </button>
  ))}
  <button ... disabled={currentPage === lastPage} onClick={...}>
    <ChevronRight size={16} />
  </button>
</div>

// AFTER — works at any scale
<div className="pagination-controls">
  <Pagination
    currentPage={currentPage}
    lastPage={studentsMeta.last_page || 1}
    total={studentsMeta.total || 0}
    perPage={itemsPerPage}
    onChange={setCurrentPage}
  />
</div>
```

**Files to modify (5 locations):**

| File | Line | Meta object | perPage var |
|------|------|-------------|-------------|
| `StudentsPage.jsx` | `768-805` | `studentsMeta` | `itemsPerPage` (8) |
| `UserManagementPage.jsx` | `466-502` | `paginationMeta` | `itemsPerPage` (10) |
| `FleetManagementPage.jsx` | `598-633` | `maintMeta` | `itemsPerPage` (10) |
| `RouteLogisticsPage.jsx` | `662-707` | `routesMeta` | `itemsPerPage` (12) |
| `FinancePage.jsx` | `848-884` | `invoiceMeta` | `invoicesPerPage` (5) |

---

## Phase 4: Fix `perPage: 1000` Anti-Pattern

### 4.1 The Problem

12 locations across 5 pages load ALL rows to populate dropdowns:

```js
// BEFORE — loads 1M users into memory
const { data: usersResponse } = useUsers({ perPage: 1000 });
const rawUsers = usersResponse?.data ?? [];
```

At 1M rows, even if the API respects the limit:
- **Response size:** 1,000 users × ~200 bytes = ~200KB payload per dropdown. Scale to students at 1M = potentially multi-MB payloads.
- **DOM size:** 1,000 `<option>` elements per select, multiplied across pages.
- **Memory:** Each object lives in React state indefinitely.

### 4.2 The Fix: Replace with `<AsyncSelect>`

Each perPage:1000 usage falls into one of two patterns:

#### Pattern A: Used as `<option>` list for native `<select>`

```jsx
// BEFORE — StudentsPage.jsx:29 rawUsers → registeredGuardians memo → <option> list
const { data: usersResponse } = useUsers({ perPage: 1000 });

// AFTER
const fetchGuardians = async (search) => {
  const data = await dashboardService.getUsers({ page: 1, perPage: 20, search });
  return (data?.data ?? []).map(u => ({
    id: String(u.user_id),
    label: `${u.first_name} ${u.last_name}`,
    sub: u.phone_number || ''
  }));
};
// Then: <AsyncSelect fetchOptions={fetchGuardians} ... />
```

#### Pattern B: Used for data lookup / client-side join

```jsx
// BEFORE — BusDetailPage.jsx:23 rawBuses used in useMemo to find matching bus
const { data: busesResponse } = useBuses({ perPage: 1000 });

// AFTER — use a targeted API call that fetches only the needed record
const { data: busDetail } = useQuery({
  queryKey: ['bus', cleanId],
  queryFn: () => fetch(`${API_URL}/buses/${cleanId}`).then(r => r.json()),
});
```

### 4.3 Per-File Migration Plan

#### `StudentsPage.jsx` — 2 replacements

| Line | Current | Type | Fix |
|------|---------|------|-----|
| `29` | `useUsers({ perPage: 1000 })` → populates guardian `<select>` in modal | Pattern A | Replace with `<AsyncSelect>` that fetches guardians by name |
| `31` | `useRoutes({ perPage: 1000 })` → populates route filter `<select>` at `650-666` | Pattern A | Replace with `<AsyncSelect>` that fetches routes by name |

**Impact:** `registeredGuardians` memo (lines 72-130), `filteredAssignStudents` logic, and guardian select dropdown all change.

**Specific changes:**
1. Remove `useUsers({ perPage: 1000 })` and `useRoutes({ perPage: 1000 })` hooks
2. Remove the `rawUsers` and `rawRoutes` variables
3. Add `fetchGuardians` and `fetchRoutes` async functions to `dashboardService` (or use existing `getUsers`/`getRoutes` with `search` param)
4. Replace the guardian `<select>` at line `882-897` with `<AsyncSelect>`
5. Replace the route filter `<select>` at line `650-666` with `<AsyncSelect>`

---

#### `RouteLogisticsPage.jsx` — 2 replacements

| Line | Current | Type | Fix |
|------|---------|------|-----|
| `68` | `useBuses({ perPage: 1000 })` → `busOptions` memo → bus dropdown | Pattern A | Replace with `<AsyncSelect>` using `getBuses({ search })` |
| `70` | `useUsers({ perPage: 1000 })` → `driverOptions` memo → driver dropdown | Pattern A | Replace with `<AsyncSelect>` using `getUsers({ search, role: 'driver' })` |

**Impact:** `busOptions` memo (lines 139-146), `driverOptions` memo (lines 107-131), both searchable dropdowns in the "New Route" modal all change. The bus dropdown is already a custom searchable dropdown (lines 834-939), just populated from the full list — it needs to become async.

---

#### `RouteDetailPage.jsx` — 4 replacements

| Line | Current | Type | Fix |
|------|---------|------|-----|
| `138` | `useRoutes({ perPage: 1000 })` → `matchedRoute` lookup → `availableDrivers` conflict check | Pattern B | Fetch the needed route directly via `useQuery` with targeted queryKey |
| `140` | `useStudents({ perPage: 1000 })` → `studentDirectory` → student search modal | Pattern A | Replace with `<AsyncSelect>` for student search |
| `142` | `useBuses({ perPage: 1000 })` → `busOptions` → bus change modal | Pattern A | Replace with `<AsyncSelect>` for bus search |
| `144` | `useUsers({ perPage: 1000 })` → `availableDrivers` → driver assignment modal | Pattern A | Replace with `<AsyncSelect>` for driver search |

**Impact:** This is the most complex page. The `availableDrivers` memo (lines 1058-1116) does conflict detection by checking all routes. At 1M rows/100K routes, this must move server-side — the API should return drivers with conflict info, not the frontend computing it by iterating all routes.

---

#### `FinancePage.jsx` — 2 replacements

| Line | Current | Type | Fix |
|------|---------|------|-----|
| `30` | `useUsers({ perPage: 1000 })` → `registeredGuardians` memo for display only | Pattern B | Remove entirely — guardians are displayed from the student/invoice data, not this list |
| `32` | `useStudents({ perPage: 1000 })` → `assignedStudentFees` memo + `<select>` at `1044-1071` | Pattern A | Replace student `<select>` in assign modal with `<AsyncSelect>` |

**Impact:** The `assignedStudentFees` table (showing all students) is the bigger issue — at 1M students, rendering all in a table without pagination will crash. This table needs its own server-side pagination.

---

#### `BusDetailPage.jsx` — 2 replacements

| Line | Current | Type | Fix |
|------|---------|------|-----|
| `23` | `useBuses({ perPage: 1000 })` → `busDetails` memo lookup | Pattern B | Use `useQuery({ queryKey: ['bus', cleanId] })` to fetch one bus by ID |
| `25` | `useRoutes({ perPage: 1000 })` → `matchedFullRoute` lookup | Pattern B | Use `useQuery({ queryKey: ['routes', busId] })` to fetch route by bus assignment |

---

### 4.4 Backend API Changes Required

The `dashboardService` currently has no `search` parameter. Add it:

**File:** `src/features/dashboard/services/dashboardService.js`

```js
// Add search param support to getUsers, getBuses, getRoutes, getStudents
async getUsers({ page = 1, perPage = 20, search = '' } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (search) params.set('search', search);
  const response = await fetch(`${API_URL}/users?${params}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
},
```

The Laravel backend must support `?search=` on the relevant endpoints. If it doesn't, it needs to be added server-side (outside scope of this plan).

---

## Phase 5: Code Splitting & Bundle Optimization

### 5.1 Lazy-load page components

**File:** `src/App.jsx`

```jsx
// BEFORE — all pages loaded upfront (654 KB bundle)
import StudentsPage from './features/dashboard/pages/StudentsPage';
import UserManagementPage from './features/dashboard/pages/UserManagementPage';
// ... 5 more static imports

// AFTER — pages load on demand
import { lazy, Suspense } from 'react';

const AuthPage = lazy(() => import('./features/auth/pages/AuthPage'));
const StudentsPage = lazy(() => import('./features/dashboard/pages/StudentsPage'));
const UserManagementPage = lazy(() => import('./features/dashboard/pages/UserManagementPage'));
const FleetManagementPage = lazy(() => import('./features/dashboard/pages/FleetManagementPage'));
const BusDetailPage = lazy(() => import('./features/dashboard/pages/BusDetailPage'));
const RouteLogisticsPage = lazy(() => import('./features/dashboard/pages/RouteLogisticsPage'));
const RouteDetailPage = lazy(() => import('./features/dashboard/pages/RouteDetailPage'));
const FinancePage = lazy(() => import('./features/dashboard/pages/FinancePage'));
```

**Wrap routes in Suspense:** Add a shared loading fallback:

```jsx
// In App.jsx, wrap each Route's element
<Route path="/students" element={
  <ProtectedRoute user={user}>
    <Suspense fallback={<div>Loading...</div>}>
      <StudentsPage user={user} onSignOut={handleSignOut} />
    </Suspense>
  </ProtectedRoute>
} />
```

**Create loading fallback component:** `src/components/ui/PageLoader.jsx`

### 5.2 Vendor chunking in Vite config

**File:** `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-leaflet': ['leaflet'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
```

**Expected result:** Initial JS drops from 654 KB → ~180 KB (react + react-query chunk). Remaining chunks load on navigation and on demand.

---

## Phase 6: Virtualization (Lower Priority)

### 6.1 Why it's lower priority

Current perPage values are 5–12. Virtualization saves DOM nodes, but at 12 rows per table, the benefit is marginal. Virtualization becomes critical if:
- `perPage` increases to 50+
- Infinite scroll replaces pagination
- Row items contain heavy DOM (maps, images, complex components)

### 6.2 Implementation approach (future)

1. Install: `npm install @tanstack/react-virtual`
2. For each table, replace `<tbody>` content with a virtual list
3. Provide `estimateSize` and `count` to `useVirtualizer`
4. Apply the list only to table containers with > 20 rows

---

## Summary Table — All Changes

| Phase | File | Action | Lines Changed |
|-------|------|--------|---------------|
| **1** | `src/hooks/useDebounce.js` | **CREATE** | ~10 |
| **1** | `src/components/ui/Pagination.jsx` | **CREATE** | ~80 |
| **1** | `src/components/ui/AsyncSelect.jsx` | **CREATE** | ~120 |
| **1** | `src/components/ui/PageLoader.jsx` | **CREATE** | ~15 |
| **2** | `StudentsPage.jsx` | Wire debounce | ~3 |
| **2** | `UserManagementPage.jsx` | Wire debounce | ~3 |
| **2** | `FleetManagementPage.jsx` | Wire debounce | ~3 |
| **2** | `RouteLogisticsPage.jsx` | Wire debounce | ~3 |
| **2** | `FinancePage.jsx` | Wire debounce | ~3 |
| **3** | `StudentsPage.jsx` | Replace pagination | ~20 removed, ~5 added |
| **3** | `UserManagementPage.jsx` | Replace pagination | ~20 removed, ~5 added |
| **3** | `FleetManagementPage.jsx` | Replace pagination | ~20 removed, ~5 added |
| **3** | `RouteLogisticsPage.jsx` | Replace pagination | ~20 removed, ~5 added |
| **3** | `FinancePage.jsx` | Replace pagination | ~20 removed, ~5 added |
| **4** | `dashboardService.js` | Add `search` param | ~20 |
| **4** | `StudentsPage.jsx` | Replace perPage:1000 → AsyncSelect ×2 | ~80 removed, ~40 added |
| **4** | `RouteLogisticsPage.jsx` | Replace perPage:1000 → AsyncSelect ×2 | ~60 removed, ~40 added |
| **4** | `RouteDetailPage.jsx` | Replace perPage:1000 → AsyncSelect ×4 | ~120 removed, ~60 added |
| **4** | `FinancePage.jsx` | Replace perPage:1000 → AsyncSelect ×2 | ~80 removed, ~40 added |
| **4** | `BusDetailPage.jsx` | Replace perPage:1000 → targeted queries | ~30 removed, ~20 added |
| **5** | `App.jsx` | `React.lazy` + `Suspense` for 8 routes | ~15 lines changed |
| **5** | `vite.config.js` | Add `manualChunks` | ~12 lines added |
| **6** | `package.json` | Install `@tanstack/react-virtual` | 1 line |
| **6** | All table pages | Add virtualization | ~100 lines total |

---

## Dependency Graph

```
useDebounce.js ─────────────────────────────────────────────────────────┐
    ↓                                                                    │
    ├─→ Phase 2: Debounce all search inputs (uses useDebounce)           │
    │                                                                     │
AsyncSelect.js ───────────────────────────────────────────────────────── │
    ↓                     │                                               │
    │                     └─→ uses useDebounce internally                  │
    ↓                                                                    │
Phase 4: Replace perPage:1000 in 12 locations (uses AsyncSelect)         │
    │                                                                     │
Pagination.js ────────────────────────────────────────────────────────── │
    ↓                                                                     │
Phase 3: Replace Array.from in 5 pages (uses Pagination)                  │
                                                                          │
Phase 5: Code splitting (independent — can run in parallel)               │
          └─→ No dependency on Phases 1-4                                 │
                                                                          │
Phase 6: Virtualization (independent — can run anytime)                   │
```

## Recommended Execution Order

1. **Phase 1** (utilities) — 2h
2. **Phase 3** (pagination) — 4h — highest crash risk, unblocked by Phase 1
3. **Phase 2** (debounce) — 1h — quick win, unblocked by Phase 1
4. **Phase 5** (code splitting) — 2h — independent, high impact
5. **Phase 4** (perPage:1000) — 12h — most complex, needs AsyncSelect from Phase 1
6. **Phase 6** (virtualization) — 6h — lower priority, schedule last

**Total: ~27h** (down from the original 49h estimate after refinement)

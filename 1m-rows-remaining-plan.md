# Remaining Work for Full 1M-Row Readiness

**Branch:** `1m-rows-scale-fixes` (already merged to main)  
**Build:** ✅ Passing (0 errors, 0 warnings)  
**Current state:** Safe to browse, won't crash. Search and driver selection still broken at 1M.

---

## What's Still Broken at 1M Rows

### 1. Search is client-side (only filters the current page)

All 5 search bars filter only the 5-12 rows loaded on the current page. A user searching for "Smith" at 1M students will see zero results unless "Smith" happens to be on page 1.

**Pages affected:**
| Page | Only searches |
|------|---------------|
| StudentsPage | 8 students on current page |
| UserManagementPage | 10 users on current page |
| FleetManagementPage | 10 maintenance records on current page |
| RouteLogisticsPage | 12 routes on current page |
| FinancePage | 5 invoices on current page |

### 2. RouteDetailPage driver modal only shows first 200 users

The `availableDrivers` memo loads `useUsers({ perPage: 200 })` — if the database has 1M users, a driver outside the first 200 will never appear in the assignment modal. The driver assignment feature silently fails to find the right person.

### 3. RouteDetailPage student search only shows first 200 students

Same problem — `useStudents({ perPage: 200 })` for the "Add Student to Stop" modal. The student you need might be on page 50,000.

---

## Implementation Plan

### Phase A: Server-Side Search (5 pages) — ~6h

**What changes:** Each search bar currently uses `debouncedSearch` to locally filter the current page. Instead, `debouncedSearch` should be sent to the API as `?search=` and the filter logic moves server-side.

#### Step A1: Add `search` param to remaining API methods

**File:** `src/features/dashboard/services/dashboardService.js`

Already done for `getUsers` and `getStudents`. Add search param to:
- `getBuses` (line 146)
- `getRoutes` (line 215)
- `getPendingMaintenance` (line 185)
- `getFeeStructures` (line 280)
- `getInvoices` (line 316)

**Pattern for each:**
```js
async getRoutes({ page = 1, perPage = 10, search = '' } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (search) params.set('search', search);
  ...
}
```

#### Step A2: Update hooks to accept and pass `search`

**Files:** `src/features/dashboard/hooks/useUsers.js`, `useStudents.js`, `useFleet.js`, `useRoutes.js`, `useFinance.js`

For each hook, add `search` to the queryKey and pass it to the service call:

```js
// BEFORE
export const useStudents = ({ page = 1, perPage = 10 } = {}) => {
  return useQuery({
    queryKey: ['students', { page, perPage }],
    queryFn: () => dashboardService.getStudents({ page, perPage }),
  });
};

// AFTER
export const useStudents = ({ page = 1, perPage = 10, search = '' } = {}) => {
  return useQuery({
    queryKey: ['students', { page, perPage, search }],
    queryFn: () => dashboardService.getStudents({ page, perPage, search }),
  });
};
```

**5 hooks to update:** `useStudents`, `useUsers`, `useBuses`, `useRoutes`, `usePendingMaintenance`, `useFeeStructures`, `useInvoices`

#### Step A3: Update each page to pass `debouncedSearch` to the hook

**Pattern for each page (example — StudentsPage.jsx):**

```jsx
// BEFORE
const { data: studentsResponse, isLoading, error } = useStudents({ page: currentPage, perPage: itemsPerPage });
// ... then filteredStudents useMemo does client-side .filter()

// AFTER
const { data: studentsResponse, isLoading, error } = useStudents({ page: currentPage, perPage: itemsPerPage, search: debouncedSearch });
// Remove filteredStudents — the API returns the right data
const displayStudents = studentsResponse?.data ?? [];
// Remove the .filter() useMemo entirely
```

**Each page needs:**
1. Pass `search: debouncedSearch` or `search: debouncedSearch.trim()` to the hook
2. Remove the client-side `.filter()` / useMemo that was filtering the current page
3. Reset `currentPage` to 1 when `debouncedSearch` changes (already done in most pages)

**Files to modify (5):**
| File | Hook to update | Filter to remove |
|------|---------------|------------------|
| `StudentsPage.jsx` | `useStudents` | `filteredStudents` useMemo (lines 186-200) |
| `UserManagementPage.jsx` | `useUsers` | `filteredUsers` raw filter (lines 95-111) |
| `FleetManagementPage.jsx` | `usePendingMaintenance` | `filteredRepairs` raw filter (lines 140-149) |
| `RouteLogisticsPage.jsx` | `useRoutes` | `filteredRoutes` raw filter (lines 324-335) |
| `FinancePage.jsx` | `useInvoices` | `filteredLedger` useMemo (lines 209-219) |

#### Step A4: Handle edge cases

- **Empty search string:** Only send `?search=` param when search is non-empty (already handled by `if (search) params.set('search', search)`)
- **Race conditions:** React Query's `queryKey` dedup handles this — if search changes before the previous request completes, the old request is cancelled
- **Pagination + search:** When `search` changes, reset to page 1 (already done in most pages via `setCurrentPage(1)` in search onChange)

---

### Phase B: RouteDetailPage AsyncSelect Replacements — ~8h

#### Step B1: Replace driver lookup with AsyncSelect

**Problem:** `availableDrivers` memo loads ALL users with `perPage: 200` — only shows first 200.

**Fix:** Replace the native driver search in the "Assign Driver" modal with `AsyncSelect` that calls `GET /api/users?search=...&per_page=20`.

**Changes needed:**
1. Remove the `useUsers({ perPage: 200 })` hook dependency from `availableDrivers`
2. Add `fetchDrivers` function using `dashboardService.getUsers({ search, perPage: 20 })`
3. Replace the driver list modal JSX with `<AsyncSelect>`
4. For conflict detection (schedule overlap): move this server-side by adding a query param like `?route_id=X` — the API returns drivers with conflict info. Or simplify: accept slight UX degradation (driver might have a conflict, warn after selection).

**Conflict detection trade-off:**
- **Current:** Frontend loads ALL users + ALL routes, computes overlaps in JS. Doesn't scale.
- **Option A (recommended):** Remove client-side conflict detection. When a driver is selected, the API validates and returns an error if there's a conflict. Simpler, scales perfectly.
- **Option B:** Add `?route_id=X` to the users API so the backend returns conflict info. Requires backend change.
- **Recommendation:** Option A — simpler, the backend should enforce this anyway.

#### Step B2: Replace student search with AsyncSelect

**Problem:** `studentDirectory` memo loads ALL students with `perPage: 200` — only shows first 200.

**Fix:** Replace the "Add Student to Stop" modal's student search with `AsyncSelect`.

**Changes needed:**
1. Remove the `useStudents({ perPage: 200 })` dependency from `studentDirectory`
2. Add `fetchStudents` function using `dashboardService.getStudents({ search, perPage: 20 })`
3. Replace the student search list JSX with `<AsyncSelect>`
4. Update `handleAddStudent` to use the selected student object directly

#### Step B3: Rebuild the driver assignment modal

The current modal has:
- Driver list with conflict detection, status badges, scrollable search
- Remove driver button

Replace with a simpler AsyncSelect-based flow:
- AsyncSelect to search and select a driver
- "Remove Driver" button stays
- Conflict warning shown after selection (if API returns error)

---

### Phase C: Data Integrity Verification — ~2h

After all changes:
1. **Build:** `npm run build` — 0 errors, 0 warnings
2. **Each page smoke test:** Navigate, load data, paginate, search, submit form
3. **AsyncSelect test:** Each replaced dropdown opens, searches, selects, clears
4. **Edge case:** Empty search returns initial options, no results state renders

---

## Effort Summary

| Phase | What | Hours |
|-------|------|-------|
| A1 | Add search to remaining API methods | 0.5h |
| A2 | Update hooks (7 files) | 1h |
| A3 | Update 5 pages to pass search + remove client filter | 3h |
| A4 | Edge cases (reset page, empty search) | 0.5h |
| B1 | Driver AsyncSelect + conflict detection removal | 4h |
| B2 | Student AsyncSelect | 2h |
| B3 | Rebuild driver modal | 2h |
| C | Verification + smoke tests | 2h |
| **Total** | | **~15h** |

---

## Dependency Graph

```
dashboardService.js (add search)  ──→  hooks/*.js (add search to queryKey)  ──→  5 pages (pass search, remove client filter)
                                    ↗
RouteDetailPage (driver AsyncSelect)  ──→  needs dashboardService.getUsers w/ search (already done)
RouteDetailPage (student AsyncSelect)  ──→  needs dashboardService.getStudents w/ search (already done)
```

Phases A and B are independent and can be done in parallel by different developers.

---

## Order Recommendation

1. **Phase A + C first** (search) — 5 pages, high impact, medium effort. Every user who types in a search bar gets correct results.
2. **Phase B second** (RouteDetailPage) — 1 page, high impact, high effort. Only affects users assigning drivers or editing stops.

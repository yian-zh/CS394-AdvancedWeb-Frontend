# Project Rules for School Bus Management System (SBMS)

## Caching & State Management
- **TanStack Query (React Query)**: Always use TanStack Query (React Query) for fetching, caching, synchronizing, and updating server state in this React application.
- **Manual Data Fetching**: Do not use manual `useEffect` + `useState` fetching loops in new page components or features.
- **Query Cache Invalidation**: When executing a mutation (create, update, delete, or link relationship), always invalidate all dependent query cache keys to ensure data remains consistent globally.
- **Session Cleanup**: Always purge the TanStack Query cache (`queryClient.clear()`) upon user logout.

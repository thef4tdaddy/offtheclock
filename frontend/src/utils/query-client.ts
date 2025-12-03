import { QueryClient } from '@tanstack/react-query';
import { get, set, del } from 'idb-keyval';
import type { PersistedClient } from '@tanstack/react-query-persist-client';

// Custom persister for IndexedDB using idb-keyval
// This matches the Persister interface required by PersistQueryClientProvider
export const idbPersister = {
  persistClient: async (client: PersistedClient) => {
    await set('react-query-cache', client);
  },
  restoreClient: async () => {
    return await get('react-query-cache');
  },
  removeClient: async () => {
    await del('react-query-cache');
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 1,
      networkMode: 'offlineFirst', // Crucial for offline support
    },
  },
});

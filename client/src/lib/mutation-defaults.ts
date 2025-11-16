import { QueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

export function setupMutationDefaults(queryClient: QueryClient) {
  queryClient.setMutationDefaults(['expense', 'create'], {
    mutationFn: async (data) => apiRequest('/api/expenses', { method: 'POST', body: data }),
  });

  queryClient.setMutationDefaults(['expense', 'update'], {
    mutationFn: async ({ id, data }: any) => apiRequest(`/api/expenses/${id}`, { method: 'PATCH', body: data }),
  });

  queryClient.setMutationDefaults(['expense', 'delete'], {
    mutationFn: async (id: string) => apiRequest(`/api/expenses/${id}`, { method: 'DELETE' }),
  });

  queryClient.setMutationDefaults(['expense', 'bulk-delete'], {
    mutationFn: async (ids: string[]) => apiRequest('/api/expenses/bulk-delete', { method: 'POST', body: { ids } }),
  });

  queryClient.setMutationDefaults(['category', 'create'], {
    mutationFn: async (data) => apiRequest('/api/categories', { method: 'POST', body: data }),
  });

  queryClient.setMutationDefaults(['category', 'update'], {
    mutationFn: async ({ id, data }: any) => apiRequest(`/api/categories/${id}`, { method: 'PATCH', body: data }),
  });

  queryClient.setMutationDefaults(['category', 'delete'], {
    mutationFn: async (id: string) => apiRequest(`/api/categories/${id}`, { method: 'DELETE' }),
  });

  queryClient.setMutationDefaults(['partner', 'create'], {
    mutationFn: async (data) => apiRequest('/api/partners', { method: 'POST', body: data }),
  });

  queryClient.setMutationDefaults(['partner', 'update'], {
    mutationFn: async ({ id, data }: any) => apiRequest(`/api/partners/${id}`, { method: 'PATCH', body: data }),
  });

  queryClient.setMutationDefaults(['partner', 'delete'], {
    mutationFn: async (id: string) => apiRequest(`/api/partners/${id}`, { method: 'DELETE' }),
  });

  queryClient.setMutationDefaults(['budget-period', 'create'], {
    mutationFn: async (data) => apiRequest('/api/budget-periods', { method: 'POST', body: data }),
  });

  queryClient.setMutationDefaults(['budget-period', 'update'], {
    mutationFn: async ({ id, data }: any) => apiRequest(`/api/budget-periods/${id}`, { method: 'PATCH', body: data }),
  });

  queryClient.setMutationDefaults(['budget-period', 'delete'], {
    mutationFn: async (id: string) => apiRequest(`/api/budget-periods/${id}`, { method: 'DELETE' }),
  });
}

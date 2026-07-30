import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useUsers = ({ page = 1, perPage = 10, search = '', role = '' } = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['users', { page, perPage, search, role }],
    queryFn: () => dashboardService.getUsers({ page, perPage, search, role }),
  });

  useEffect(() => {
    const lastPage = query.data?.last_page || query.data?.meta?.last_page;
    if (lastPage && page < lastPage) {
      queryClient.prefetchQuery({
        queryKey: ['users', { page: page + 1, perPage, search, role }],
        queryFn: () => dashboardService.getUsers({ page: page + 1, perPage, search, role }),
      });
    }
  }, [query.data, page, perPage, search, role, queryClient]);

  return query;
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userData }) => dashboardService.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => dashboardService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

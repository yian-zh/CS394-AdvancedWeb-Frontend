import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useBuses = ({ page = 1, perPage = 10, search = '', status = '' } = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['buses', { page, perPage, search, status }],
    queryFn: () => dashboardService.getBuses({ page, perPage, search, status }),
  });

  useEffect(() => {
    const lastPage = query.data?.last_page || query.data?.meta?.last_page;
    if (lastPage && page < lastPage) {
      queryClient.prefetchQuery({
        queryKey: ['buses', { page: page + 1, perPage, search, status }],
        queryFn: () => dashboardService.getBuses({ page: page + 1, perPage, search, status }),
      });
    }
  }, [query.data, page, perPage, search, status, queryClient]);

  return query;
};

export const usePendingMaintenance = ({ page = 1, perPage = 10, search = '' } = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['maintenance', 'pending', { page, perPage, search }],
    queryFn: () => dashboardService.getPendingMaintenance({ page, perPage, search }),
  });

  useEffect(() => {
    const lastPage = query.data?.last_page || query.data?.meta?.last_page;
    if (lastPage && page < lastPage) {
      queryClient.prefetchQuery({
        queryKey: ['maintenance', 'pending', { page: page + 1, perPage, search }],
        queryFn: () => dashboardService.getPendingMaintenance({ page: page + 1, perPage, search }),
      });
    }
  }, [query.data, page, perPage, search, queryClient]);

  return query;
};

export const useCreateMaintenanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createMaintenanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'pending'] });
    },
  });
};

export const useResolveMaintenanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mongoId, repairData }) => dashboardService.resolveMaintenanceRequest(mongoId, repairData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
};

export const useUploadBusDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, docData }) => dashboardService.uploadBusDocument(id, docData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
};

export const useAssignDriverToBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.assignDriverToBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useCreateBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
};

export const useUpdateBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, busData }) => dashboardService.updateBus(id, busData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
};

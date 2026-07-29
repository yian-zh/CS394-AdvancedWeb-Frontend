import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useBuses = ({ page = 1, perPage = 10, search = '' } = {}) => {
  return useQuery({
    queryKey: ['buses', { page, perPage, search }],
    queryFn: () => dashboardService.getBuses({ page, perPage, search }),
  });
};

export const usePendingMaintenance = ({ page = 1, perPage = 10, search = '' } = {}) => {
  return useQuery({
    queryKey: ['maintenance', 'pending', { page, perPage, search }],
    queryFn: () => dashboardService.getPendingMaintenance({ page, perPage, search }),
  });
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

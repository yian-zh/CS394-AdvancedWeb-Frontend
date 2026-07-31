import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useFeeStructures = ({ page = 1, perPage = 10, search = '' } = {}) => {
  return useQuery({
    queryKey: ['feeStructures', { page, perPage, search }],
    queryFn: () => dashboardService.getFeeStructures({ page, perPage, search }),
  });
};

export const useCreateFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
    },
  });
};

export const useUpdateFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feeData }) => dashboardService.updateFeeStructure(id, feeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
    },
  });
};

export const useAssignFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.assignFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUnassignFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.unassignFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useInvoices = ({ page = 1, perPage = 10, search = '', status = '' } = {}) => {
  return useQuery({
    queryKey: ['invoices', { page, perPage, search, status }],
    queryFn: () => dashboardService.getInvoices({ page, perPage, search, status }),
  });
};

export const useGenerateInvoices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.generateInvoices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => dashboardService.updateInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

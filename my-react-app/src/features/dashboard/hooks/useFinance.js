import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useFeeStructures = () => {
  return useQuery({
    queryKey: ['feeStructures'],
    queryFn: dashboardService.getFeeStructures,
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
    },
  });
};

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: dashboardService.getInvoices,
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

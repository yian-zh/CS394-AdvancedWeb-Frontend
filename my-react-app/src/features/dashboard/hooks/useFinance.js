import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useFeeStructures = ({ page = 1, perPage = 10 } = {}) => {
  return useQuery({
    queryKey: ['feeStructures', { page, perPage }],
    queryFn: () => dashboardService.getFeeStructures({ page, perPage }),
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

export const useInvoices = ({ page = 1, perPage = 10 } = {}) => {
  return useQuery({
    queryKey: ['invoices', { page, perPage }],
    queryFn: () => dashboardService.getInvoices({ page, perPage }),
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

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => dashboardService.sendInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useSendStudentInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId) => dashboardService.sendStudentInvoice(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useSendAllInvoices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.sendAllInvoices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

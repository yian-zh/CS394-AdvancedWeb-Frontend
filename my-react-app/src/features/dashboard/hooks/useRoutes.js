import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useRoutes = () => {
  return useQuery({
    queryKey: ['routes'],
    queryFn: dashboardService.getRoutes,
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
};

export const useManageStops = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stopData }) => dashboardService.manageStops(id, stopData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
};

export const useAssignBusToRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.assignBusToRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
};

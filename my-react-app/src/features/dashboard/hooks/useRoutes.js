import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useRoutes = ({ page = 1, perPage = 10, search = '' } = {}) => {
  return useQuery({
    queryKey: ['routes', { page, perPage, search }],
    queryFn: () => dashboardService.getRoutes({ page, perPage, search }),
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

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, routeData }) => dashboardService.updateRoute(id, routeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => dashboardService.deleteRoute(id),
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

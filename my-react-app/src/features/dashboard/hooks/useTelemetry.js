import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useDatabaseTelemetry = ({ refetchInterval = 15000 } = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['telemetry', 'database'],
    queryFn: dashboardService.getDatabaseTelemetry,
    refetchInterval,
    staleTime: 5000,
  });

  const forceRefetch = () => {
    return queryClient.invalidateQueries({ queryKey: ['telemetry', 'database'] });
  };

  return {
    ...query,
    forceRefetch,
  };
};

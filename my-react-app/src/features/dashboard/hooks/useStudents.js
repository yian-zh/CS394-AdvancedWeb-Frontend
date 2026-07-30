import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useStudents = ({ page = 1, perPage = 10, search = '', grade = '', routeId = '' } = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['students', { page, perPage, search, grade, routeId }],
    queryFn: () => dashboardService.getStudents({ page, perPage, search, grade, routeId }),
  });

  // Prefetch next page (page + 1) in the background when current page query succeeds
  useEffect(() => {
    const lastPage = query.data?.last_page || query.data?.meta?.last_page;
    if (lastPage && page < lastPage) {
      queryClient.prefetchQuery({
        queryKey: ['students', { page: page + 1, perPage, search, grade, routeId }],
        queryFn: () => dashboardService.getStudents({ page: page + 1, perPage, search, grade, routeId }),
      });
    }
  }, [query.data, page, perPage, search, grade, routeId, queryClient]);

  return query;
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, studentData }) => dashboardService.updateStudent(id, studentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useAssignGuardian = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.assignGuardian,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => dashboardService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

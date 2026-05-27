import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from 'services/userService';

export function useAllUsers(enabled = false) {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => userService.listAll(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCapacidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, capacidad }: { id: string; capacidad: number }) =>
      userService.updateCapacidad(id, capacidad),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['currentDbUser'] }),
  });
}

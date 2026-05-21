import { useQuery } from '@tanstack/react-query';
import { userService } from 'services/userService';

export function useAllUsers(enabled = false) {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => userService.listAll(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

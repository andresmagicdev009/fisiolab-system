import { useQuery } from '@tanstack/react-query';
import { userService } from 'services/userService';

export function useCurrentDbUser() {
  return useQuery({
    queryKey: ['currentDbUser'],
    queryFn: userService.getMe,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

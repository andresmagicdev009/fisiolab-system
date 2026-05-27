import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { availabilityService, SlotInput } from 'services/availabilityService';

export function useProfessionalAvailability(professionalId: string | null | undefined) {
  return useQuery({
    queryKey: ['availability', professionalId],
    queryFn: () => availabilityService.getByProfessional(professionalId!),
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBatchReplaceAvailability(professionalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slots: SlotInput[]) =>
      availabilityService.batchReplace(professionalId, slots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', professionalId] });
      queryClient.invalidateQueries({ queryKey: ['currentDbUser'] });
    },
  });
}

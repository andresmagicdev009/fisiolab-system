import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tarjeteroService } from 'services/tarjeteroService';
import { CreateTarjeteroDto, UpdateTarjeteroDto } from 'types/models';

const KEY = 'tarjetero';

export function useTarjetero(patientId: string) {
  return useQuery({
    queryKey: [KEY, patientId],
    queryFn: () => tarjeteroService.getByPatient(patientId),
    enabled: !!patientId,
    retry: (failCount, error: any) =>
      error?.response?.status !== 404 && failCount < 2,
  });
}

export function useCreateTarjetero() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      payload,
    }: {
      patientId: string;
      payload: CreateTarjeteroDto;
    }) => tarjeteroService.create(patientId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData([KEY, data.pacienteId], data);
    },
  });
}

export function useUpdateTarjetero() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      payload,
    }: {
      patientId: string;
      payload: UpdateTarjeteroDto;
    }) => tarjeteroService.update(patientId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData([KEY, data.pacienteId], data);
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { episodeService } from 'services/episodeService';
import {
  CloseEpisodioDto,
  CreateEpisodioDto,
  UpdateEpisodioDto,
} from 'types/models';

const KEY = 'episodes';

export function useEpisodesByPatient(patientId: string) {
  return useQuery({
    queryKey: [KEY, 'patient', patientId],
    queryFn: () => episodeService.listByPatient(patientId),
    enabled: !!patientId,
    select: (res) => res.data,
  });
}

export function useCreateEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      payload,
    }: {
      patientId: string;
      payload: CreateEpisodioDto;
    }) => episodeService.create(patientId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'patient', data.pacienteId] });
    },
  });
}

export function useUpdateEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      payload: UpdateEpisodioDto;
    }) => episodeService.update(patientId, episodeId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'patient', data.pacienteId] });
    },
  });
}

export function useCloseEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      payload: CloseEpisodioDto;
    }) => episodeService.close(patientId, episodeId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'patient', data.pacienteId] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { soapService } from 'services/soapService';
import { CreateSoapNoteDto, UpdateSoapNoteDto } from 'types/models';

const KEY = 'soap';

export function useSoapNotesByEpisode(patientId: string, episodeId: string) {
  return useQuery({
    queryKey: [KEY, 'episode', episodeId],
    queryFn: () => soapService.listByEpisode(patientId, episodeId),
    enabled: !!patientId && !!episodeId,
    select: (res) => res.data,
  });
}

export function useSoapNote(patientId: string, episodeId: string, soapId: string | null) {
  return useQuery({
    queryKey: [KEY, 'detail', soapId],
    queryFn: () => soapService.getById(patientId, episodeId, soapId!),
    enabled: !!patientId && !!episodeId && !!soapId,
  });
}

export function useCreateSoapNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      payload: CreateSoapNoteDto;
    }) => soapService.create(patientId, episodeId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'episode', data.episodeId] });
      // episode may transition to en_tratamiento — invalidate episodes too
      queryClient.invalidateQueries({ queryKey: ['episodes', 'patient', data.pacienteId] });
    },
  });
}

export function useUpdateSoapNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      soapId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      soapId: string;
      payload: UpdateSoapNoteDto;
    }) => soapService.update(patientId, episodeId, soapId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'episode', data.episodeId] });
      queryClient.invalidateQueries({ queryKey: [KEY, 'detail', data.id] });
    },
  });
}

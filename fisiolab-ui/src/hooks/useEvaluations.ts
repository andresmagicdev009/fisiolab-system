import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { evaluationService } from 'services/evaluationService';
import { CreateEvaluacionDto, UpdateEvaluacionDto } from 'types/models';

const KEY = 'evaluations';

export function useEvaluationsByEpisode(patientId: string, episodeId: string) {
  return useQuery({
    queryKey: [KEY, 'episode', episodeId],
    queryFn: () => evaluationService.listByEpisode(patientId, episodeId),
    enabled: !!patientId && !!episodeId,
    select: (res) => res.data,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      payload: CreateEvaluacionDto;
    }) => evaluationService.create(patientId, episodeId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'episode', data.episodeId] });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      evalId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      evalId: string;
      payload: UpdateEvaluacionDto;
    }) => evaluationService.update(patientId, episodeId, evalId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'episode', data.episodeId] });
    },
  });
}

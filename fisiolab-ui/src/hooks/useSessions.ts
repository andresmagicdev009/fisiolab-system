import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionService } from 'services/sessionService';
import { CreateSessionDto, EstadoSesion, Session, UpdateSessionDto } from 'types/models';

const KEY = 'sessions';

export function useSessionsByPlan(patientId: string, episodeId: string, planId: string) {
  return useQuery({
    queryKey: [KEY, 'plan', planId],
    queryFn: () => sessionService.listByPlan(patientId, episodeId, planId),
    enabled: !!patientId && !!episodeId && !!planId,
    select: (res) => res.data,
  });
}

export function useSessionDetail(
  patientId: string,
  episodeId: string,
  planId: string,
  sessionId: string | null,
) {
  return useQuery({
    queryKey: [KEY, 'detail', sessionId],
    queryFn: () => sessionService.getById(patientId, episodeId, planId, sessionId!),
    enabled: !!patientId && !!episodeId && !!planId && !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      planId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      planId: string;
      payload: CreateSessionDto;
    }) => sessionService.create(patientId, episodeId, planId, payload),
    onSuccess: (session: Session) => {
      if (session.planId) {
        queryClient.invalidateQueries({ queryKey: [KEY, 'plan', session.planId] });
      }
      queryClient.invalidateQueries({ queryKey: ['plans', 'episode', session.episodeId] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      planId,
      sessionId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      planId: string;
      sessionId: string;
      payload: UpdateSessionDto;
    }) => sessionService.update(patientId, episodeId, planId, sessionId, payload),
    onSuccess: (session: Session) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'detail', session.id] });
      if (session.planId) {
        queryClient.invalidateQueries({ queryKey: [KEY, 'plan', session.planId] });
        queryClient.invalidateQueries({ queryKey: ['plans', 'episode', session.episodeId] });
      }
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      planId,
      sessionId,
    }: {
      patientId: string;
      episodeId: string;
      planId: string;
      sessionId: string;
    }) => sessionService.delete(patientId, episodeId, planId, sessionId),
    onSuccess: (
      _data: void,
      vars: { patientId: string; episodeId: string; planId: string; sessionId: string },
    ) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'plan', vars.planId] });
    },
  });
}

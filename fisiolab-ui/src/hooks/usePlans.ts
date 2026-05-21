import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planService } from 'services/planService';
import {
  CreateExerciseDto,
  CreatePlanDto,
  Exercise,
  ReorderExercisesDto,
  TreatmentPlan,
  UpdateExerciseDto,
  UpdatePlanDto,
} from 'types/models';

const KEY = 'plans';

export function usePlansByEpisode(patientId: string, episodeId: string) {
  return useQuery({
    queryKey: [KEY, 'episode', episodeId],
    queryFn: () => planService.listByEpisode(patientId, episodeId),
    enabled: !!patientId && !!episodeId,
    select: (res) => res.data,
  });
}

export function usePlanDetail(patientId: string, episodeId: string, planId: string | null) {
  return useQuery({
    queryKey: [KEY, 'detail', planId],
    queryFn: () => planService.getById(patientId, episodeId, planId!),
    enabled: !!patientId && !!episodeId && !!planId,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      payload: CreatePlanDto;
    }) => planService.create(patientId, episodeId, payload),
    onSuccess: (plan: TreatmentPlan) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'episode', plan.episodeId] });
    },
  });
}

export function useUpdatePlan() {
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
      payload: UpdatePlanDto;
    }) => planService.update(patientId, episodeId, planId, payload),
    onSuccess: (plan: TreatmentPlan) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'episode', plan.episodeId] });
      queryClient.invalidateQueries({ queryKey: [KEY, 'detail', plan.id] });
    },
  });
}

export function useCreateExercise() {
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
      payload: CreateExerciseDto;
    }) => planService.createExercise(patientId, episodeId, planId, payload),
    onSuccess: (exercise: Exercise) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'detail', exercise.planId] });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      planId,
      exId,
      payload,
    }: {
      patientId: string;
      episodeId: string;
      planId: string;
      exId: string;
      payload: UpdateExerciseDto;
    }) => planService.updateExercise(patientId, episodeId, planId, exId, payload),
    onSuccess: (exercise: Exercise) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'detail', exercise.planId] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      episodeId,
      planId,
      exId,
    }: {
      patientId: string;
      episodeId: string;
      planId: string;
      exId: string;
    }) => planService.deleteExercise(patientId, episodeId, planId, exId),
    onSuccess: (_data: void, vars: { planId: string; patientId: string; episodeId: string; exId: string }) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'detail', vars.planId] });
    },
  });
}

export function useReorderExercises() {
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
      payload: ReorderExercisesDto;
    }) => planService.reorderExercises(patientId, episodeId, planId, payload),
    onSuccess: (_data: Exercise[], vars: { planId: string; patientId: string; episodeId: string; payload: ReorderExercisesDto }) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'detail', vars.planId] });
    },
  });
}

import {
  CreateExerciseDto,
  CreatePlanDto,
  Exercise,
  ReorderExercisesDto,
  TreatmentPlan,
  UpdateExerciseDto,
  UpdatePlanDto,
} from 'types/models';
import apiClient from './apiClient';

interface PaginatedPlans {
  data: TreatmentPlan[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const base = (patientId: string, episodeId: string) =>
  `/patients/${patientId}/episodes/${episodeId}/plans`;

export const planService = {
  listByEpisode: async (patientId: string, episodeId: string, page = 1, limit = 50): Promise<PaginatedPlans> => {
    const { data } = await apiClient.get<PaginatedPlans>(base(patientId, episodeId), { params: { page, limit } });
    return data;
  },

  getById: async (patientId: string, episodeId: string, planId: string): Promise<TreatmentPlan> => {
    const { data } = await apiClient.get<TreatmentPlan>(`${base(patientId, episodeId)}/${planId}`);
    return data;
  },

  create: async (patientId: string, episodeId: string, payload: CreatePlanDto): Promise<TreatmentPlan> => {
    const { data } = await apiClient.post<TreatmentPlan>(base(patientId, episodeId), payload);
    return data;
  },

  update: async (patientId: string, episodeId: string, planId: string, payload: UpdatePlanDto): Promise<TreatmentPlan> => {
    const { data } = await apiClient.patch<TreatmentPlan>(`${base(patientId, episodeId)}/${planId}`, payload);
    return data;
  },

  createExercise: async (patientId: string, episodeId: string, planId: string, payload: CreateExerciseDto): Promise<Exercise> => {
    const { data } = await apiClient.post<Exercise>(`${base(patientId, episodeId)}/${planId}/exercises`, payload);
    return data;
  },

  updateExercise: async (patientId: string, episodeId: string, planId: string, exId: string, payload: UpdateExerciseDto): Promise<Exercise> => {
    const { data } = await apiClient.patch<Exercise>(`${base(patientId, episodeId)}/${planId}/exercises/${exId}`, payload);
    return data;
  },

  deleteExercise: async (patientId: string, episodeId: string, planId: string, exId: string): Promise<void> => {
    await apiClient.delete(`${base(patientId, episodeId)}/${planId}/exercises/${exId}`);
  },

  reorderExercises: async (patientId: string, episodeId: string, planId: string, payload: ReorderExercisesDto): Promise<Exercise[]> => {
    const { data } = await apiClient.patch<Exercise[]>(`${base(patientId, episodeId)}/${planId}/exercises/reorder`, payload);
    return data;
  },
};

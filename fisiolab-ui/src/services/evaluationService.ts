import { CreateEvaluacionDto, PhysicalEvaluation, UpdateEvaluacionDto } from 'types/models';
import apiClient from './apiClient';

interface PaginatedEvals {
  data: PhysicalEvaluation[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const base = (patientId: string, episodeId: string) =>
  `/patients/${patientId}/episodes/${episodeId}/evaluations`;

export const evaluationService = {
  listByEpisode: async (
    patientId: string,
    episodeId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedEvals> => {
    const { data } = await apiClient.get<PaginatedEvals>(base(patientId, episodeId), {
      params: { page, limit },
    });
    return data;
  },

  getById: async (
    patientId: string,
    episodeId: string,
    evalId: string,
  ): Promise<PhysicalEvaluation> => {
    const { data } = await apiClient.get<PhysicalEvaluation>(
      `${base(patientId, episodeId)}/${evalId}`,
    );
    return data;
  },

  create: async (
    patientId: string,
    episodeId: string,
    payload: CreateEvaluacionDto,
  ): Promise<PhysicalEvaluation> => {
    const { data } = await apiClient.post<PhysicalEvaluation>(
      base(patientId, episodeId),
      payload,
    );
    return data;
  },

  update: async (
    patientId: string,
    episodeId: string,
    evalId: string,
    payload: UpdateEvaluacionDto,
  ): Promise<PhysicalEvaluation> => {
    const { data } = await apiClient.patch<PhysicalEvaluation>(
      `${base(patientId, episodeId)}/${evalId}`,
      payload,
    );
    return data;
  },
};

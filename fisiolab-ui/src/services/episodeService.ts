import {
  ClinicalEpisode,
  CloseEpisodioDto,
  CreateEpisodioDto,
  UpdateEpisodioDto,
} from 'types/models';
import apiClient from './apiClient';

interface PaginatedEpisodes {
  data: ClinicalEpisode[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export const episodeService = {
  listByPatient: async (
    patientId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedEpisodes> => {
    const { data } = await apiClient.get<PaginatedEpisodes>(
      `/patients/${patientId}/episodes`,
      { params: { page, limit } },
    );
    return data;
  },

  getById: async (
    patientId: string,
    episodeId: string,
  ): Promise<ClinicalEpisode> => {
    const { data } = await apiClient.get<ClinicalEpisode>(
      `/patients/${patientId}/episodes/${episodeId}`,
    );
    return data;
  },

  create: async (
    patientId: string,
    payload: CreateEpisodioDto,
  ): Promise<ClinicalEpisode> => {
    const { data } = await apiClient.post<ClinicalEpisode>(
      `/patients/${patientId}/episodes`,
      payload,
    );
    return data;
  },

  update: async (
    patientId: string,
    episodeId: string,
    payload: UpdateEpisodioDto,
  ): Promise<ClinicalEpisode> => {
    const { data } = await apiClient.patch<ClinicalEpisode>(
      `/patients/${patientId}/episodes/${episodeId}`,
      payload,
    );
    return data;
  },

  close: async (
    patientId: string,
    episodeId: string,
    payload: CloseEpisodioDto,
  ): Promise<ClinicalEpisode> => {
    const { data } = await apiClient.post<ClinicalEpisode>(
      `/patients/${patientId}/episodes/${episodeId}/close`,
      payload,
    );
    return data;
  },
};

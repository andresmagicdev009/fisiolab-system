import { CreateSessionDto, Session, SessionListResponse, UpdateSessionDto } from 'types/models';
import apiClient from './apiClient';

const base = (patientId: string, episodeId: string, planId: string) =>
  `/patients/${patientId}/episodes/${episodeId}/plans/${planId}/sessions`;

export const sessionService = {
  listByPlan: async (
    patientId: string,
    episodeId: string,
    planId: string,
  ): Promise<SessionListResponse> => {
    const { data } = await apiClient.get<SessionListResponse>(
      base(patientId, episodeId, planId),
      { params: { limit: 50 } },
    );
    return data;
  },

  getById: async (
    patientId: string,
    episodeId: string,
    planId: string,
    sessionId: string,
  ): Promise<Session> => {
    const { data } = await apiClient.get<Session>(
      `${base(patientId, episodeId, planId)}/${sessionId}`,
    );
    return data;
  },

  create: async (
    patientId: string,
    episodeId: string,
    planId: string,
    payload: CreateSessionDto,
  ): Promise<Session> => {
    const { data } = await apiClient.post<Session>(
      base(patientId, episodeId, planId),
      payload,
    );
    return data;
  },

  update: async (
    patientId: string,
    episodeId: string,
    planId: string,
    sessionId: string,
    payload: UpdateSessionDto,
  ): Promise<Session> => {
    const { data } = await apiClient.patch<Session>(
      `${base(patientId, episodeId, planId)}/${sessionId}`,
      payload,
    );
    return data;
  },

  delete: async (
    patientId: string,
    episodeId: string,
    planId: string,
    sessionId: string,
  ): Promise<void> => {
    await apiClient.delete(`${base(patientId, episodeId, planId)}/${sessionId}`);
  },
};

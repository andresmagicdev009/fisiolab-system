import { CreateSoapNoteDto, SoapNote, UpdateSoapNoteDto } from 'types/models';
import apiClient from './apiClient';

interface PaginatedSoap {
  data: SoapNote[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const base = (patientId: string, episodeId: string) =>
  `/patients/${patientId}/episodes/${episodeId}/soap`;

export const soapService = {
  listByEpisode: async (
    patientId: string,
    episodeId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedSoap> => {
    const { data } = await apiClient.get<PaginatedSoap>(base(patientId, episodeId), {
      params: { page, limit },
    });
    return data;
  },

  getById: async (
    patientId: string,
    episodeId: string,
    soapId: string,
  ): Promise<SoapNote> => {
    const { data } = await apiClient.get<SoapNote>(`${base(patientId, episodeId)}/${soapId}`);
    return data;
  },

  create: async (
    patientId: string,
    episodeId: string,
    payload: CreateSoapNoteDto,
  ): Promise<SoapNote> => {
    const { data } = await apiClient.post<SoapNote>(base(patientId, episodeId), payload);
    return data;
  },

  update: async (
    patientId: string,
    episodeId: string,
    soapId: string,
    payload: UpdateSoapNoteDto,
  ): Promise<SoapNote> => {
    const { data } = await apiClient.patch<SoapNote>(
      `${base(patientId, episodeId)}/${soapId}`,
      payload,
    );
    return data;
  },
};

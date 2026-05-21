import {
  CreateTarjeteroDto,
  TarjeteroIndice,
  UpdateTarjeteroDto,
} from 'types/models';
import apiClient from './apiClient';

export const tarjeteroService = {
  getByPatient: async (patientId: string): Promise<TarjeteroIndice> => {
    const { data } = await apiClient.get<TarjeteroIndice>(
      `/patients/${patientId}/tarjetero`,
    );
    return data;
  },

  create: async (
    patientId: string,
    payload: CreateTarjeteroDto,
  ): Promise<TarjeteroIndice> => {
    const { data } = await apiClient.post<TarjeteroIndice>(
      `/patients/${patientId}/tarjetero`,
      payload,
    );
    return data;
  },

  update: async (
    patientId: string,
    payload: UpdateTarjeteroDto,
  ): Promise<TarjeteroIndice> => {
    const { data } = await apiClient.patch<TarjeteroIndice>(
      `/patients/${patientId}/tarjetero`,
      payload,
    );
    return data;
  },
};

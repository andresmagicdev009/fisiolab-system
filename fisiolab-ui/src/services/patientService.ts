import { CreatePatientData, Patient, UpdatePatientData } from 'types/models';
import apiClient from './apiClient';

const BASE = '/patients';

export const patientService = {
  getAll: async (): Promise<Patient[]> => {
    const { data } = await apiClient.get<Patient[]>(BASE);
    return data;
  },

  getById: async (id: string): Promise<Patient> => {
    const { data } = await apiClient.get<Patient>(`${BASE}/${id}`);
    return data;
  },

  create: async (payload: CreatePatientData): Promise<Patient> => {
    const { data } = await apiClient.post<Patient>(BASE, payload);
    return data;
  },

  update: async (id: string, payload: UpdatePatientData): Promise<Patient> => {
    const { data } = await apiClient.patch<Patient>(`${BASE}/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

import apiClient from './apiClient';
import type { Patient, CreatePatientData, UpdatePatientData } from '../types/models';

export interface PatientsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

const BASE = '/patients';

export const patientsService = {
  async create(data: CreatePatientData): Promise<Patient> {
    const res = await apiClient.post<Patient>(BASE, data);
    return res.data;
  },

  async getAll(params?: PatientsQueryParams): Promise<Patient[]> {
    const res = await apiClient.get<Patient[]>(BASE, { params });
    return res.data;
  },

  async getOne(id: string): Promise<Patient> {
    const res = await apiClient.get<Patient>(`${BASE}/${id}`);
    return res.data;
  },

  async update(id: string, data: UpdatePatientData): Promise<Patient> {
    const res = await apiClient.patch<Patient>(`${BASE}/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },
};

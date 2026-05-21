import apiClient from './apiClient';

export const historiaClinicaService = {
  getResumen: (patientId: string) =>
    apiClient.get(`/patients/${patientId}/historia-clinica`).then((r) => r.data),
};

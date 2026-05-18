import {
  AntecedentesCompletos,
  AntecedentesGineco,
  AntecedentesHeredofamiliar,
  AntecedentesNoPatologico,
  AntecedentesPatologico,
} from 'types/models';
import apiClient from './apiClient';

const base = (patientId: string) => `/patients/${patientId}/antecedentes`;

export const antecedenteService = {
  getAll: (patientId: string) =>
    apiClient.get<AntecedentesCompletos>(base(patientId)).then((r) => r.data),

  getHeredofamiliares: (patientId: string) =>
    apiClient
      .get<AntecedentesHeredofamiliar>(`${base(patientId)}/heredofamiliares`)
      .then((r) => r.data),

  updateHeredofamiliares: (patientId: string, payload: Partial<AntecedentesHeredofamiliar>) =>
    apiClient
      .patch<AntecedentesHeredofamiliar>(`${base(patientId)}/heredofamiliares`, payload)
      .then((r) => r.data),

  getPatologicos: (patientId: string) =>
    apiClient
      .get<AntecedentesPatologico>(`${base(patientId)}/patologicos`)
      .then((r) => r.data),

  updatePatologicos: (patientId: string, payload: Partial<AntecedentesPatologico>) =>
    apiClient
      .patch<AntecedentesPatologico>(`${base(patientId)}/patologicos`, payload)
      .then((r) => r.data),

  getNoPatologicos: (patientId: string) =>
    apiClient
      .get<AntecedentesNoPatologico>(`${base(patientId)}/no-patologicos`)
      .then((r) => r.data),

  updateNoPatologicos: (patientId: string, payload: Partial<AntecedentesNoPatologico>) =>
    apiClient
      .patch<AntecedentesNoPatologico>(`${base(patientId)}/no-patologicos`, payload)
      .then((r) => r.data),

  getGineco: (patientId: string) =>
    apiClient
      .get<AntecedentesGineco>(`${base(patientId)}/gineco-obstetricos`)
      .then((r) => r.data),

  updateGineco: (patientId: string, payload: Partial<AntecedentesGineco>) =>
    apiClient
      .patch<AntecedentesGineco>(`${base(patientId)}/gineco-obstetricos`, payload)
      .then((r) => r.data),
};

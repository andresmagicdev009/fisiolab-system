import {
  Appointment,
  CancelAppointmentDto,
  CompleteAppointmentDto,
  CompleteAppointmentResponse,
  CreateAppointmentDto,
  EnrichedAppointment,
  RescheduleAppointmentDto,
  RescheduleAppointmentResponse,
  UpdateAppointmentDto,
} from 'types/models';
import apiClient from './apiClient';

interface PaginatedAppointments {
  data: Appointment[];
  meta: { total: number; page: number; limit: number; pages: number };
}

interface PaginatedEnrichedAppointments {
  data: EnrichedAppointment[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface AppointmentQuery {
  page?: number;
  limit?: number;
  estado?: string;
  tipoCita?: string;
  professionalId?: string;
  patientId?: string;
  desde?: string;
  hasta?: string;
}

export const appointmentService = {
  list: async (params: AppointmentQuery = {}): Promise<PaginatedAppointments> => {
    const { data } = await apiClient.get<PaginatedAppointments>('/appointments', { params });
    return data;
  },

  listByPatient: async (patientId: string, params: Omit<AppointmentQuery, 'patientId'> = {}): Promise<PaginatedEnrichedAppointments> => {
    const { data } = await apiClient.get<PaginatedEnrichedAppointments>(`/patients/${patientId}/appointments`, { params });
    return data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const { data } = await apiClient.get<Appointment>(`/appointments/${id}`);
    return data;
  },

  create: async (payload: CreateAppointmentDto): Promise<Appointment> => {
    const { data } = await apiClient.post<Appointment>('/appointments', payload);
    return data;
  },

  update: async (id: string, payload: UpdateAppointmentDto): Promise<Appointment> => {
    const { data } = await apiClient.patch<Appointment>(`/appointments/${id}`, payload);
    return data;
  },

  cancel: async (id: string, payload: CancelAppointmentDto): Promise<Appointment> => {
    const { data } = await apiClient.post<Appointment>(`/appointments/${id}/cancel`, payload);
    return data;
  },

  complete: async (id: string, payload: CompleteAppointmentDto): Promise<CompleteAppointmentResponse> => {
    const { data } = await apiClient.post<CompleteAppointmentResponse>(`/appointments/${id}/complete`, payload);
    return data;
  },

  reschedule: async (id: string, payload: RescheduleAppointmentDto): Promise<RescheduleAppointmentResponse> => {
    const { data } = await apiClient.post<RescheduleAppointmentResponse>(`/appointments/${id}/reschedule`, payload);
    return data;
  },

  noShow: async (id: string): Promise<Appointment> => {
    const { data } = await apiClient.post<Appointment>(`/appointments/${id}/no-show`);
    return data;
  },
};

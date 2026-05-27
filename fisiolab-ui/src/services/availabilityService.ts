import apiClient from './apiClient';

export interface SlotInput {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
  zonaHoraria?: string;
}

export interface Availability {
  id: string;
  professionalId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  breakDurationMinutes: number;
  isActive: boolean;
  zonaHoraria: string;
  createdAt: string;
  updatedAt: string;
}

export const availabilityService = {
  getByProfessional: async (professionalId: string): Promise<Availability[]> => {
    const { data } = await apiClient.get<Availability[]>(
      `/professionals/${professionalId}/availability`,
    );
    return data;
  },

  batchReplace: async (professionalId: string, slots: SlotInput[]): Promise<Availability[]> => {
    const { data } = await apiClient.put<Availability[]>(
      `/professionals/${professionalId}/availability`,
      { slots },
    );
    return data;
  },
};

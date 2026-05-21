import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AppointmentQuery,
  appointmentService,
} from 'services/appointmentService';
import {
  Appointment,
  CancelAppointmentDto,
  CompleteAppointmentDto,
  CompleteAppointmentResponse,
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  RescheduleAppointmentResponse,
  UpdateAppointmentDto,
} from 'types/models';

const KEY = 'appointments';

export function useAppointments(params: AppointmentQuery = {}) {
  return useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => appointmentService.list(params),
    select: (res) => res,
  });
}

export function useAppointmentsByPatient(patientId: string, params: AppointmentQuery = {}) {
  return useQuery({
    queryKey: [KEY, 'patient', patientId, params],
    queryFn: () => appointmentService.listByPatient(patientId, params),
    enabled: !!patientId,
    select: (res) => res,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentDto) => appointmentService.create(payload),
    onSuccess: (appt: Appointment) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [KEY, 'patient', appt.patientId] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAppointmentDto }) =>
      appointmentService.update(id, payload),
    onSuccess: (appt: Appointment) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [KEY, 'patient', appt.patientId] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelAppointmentDto }) =>
      appointmentService.cancel(id, payload),
    onSuccess: (appt: Appointment) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [KEY, 'patient', appt.patientId] });
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompleteAppointmentDto }) =>
      appointmentService.complete(id, payload),
    onSuccess: (res: CompleteAppointmentResponse) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [KEY, 'patient', res.appointment.patientId] });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RescheduleAppointmentDto }) =>
      appointmentService.reschedule(id, payload),
    onSuccess: (res: RescheduleAppointmentResponse) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [KEY, 'patient', res.original.patientId] });
    },
  });
}

export function useNoShowAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentService.noShow(id),
    onSuccess: (appt: Appointment) => {
      queryClient.invalidateQueries({ queryKey: [KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [KEY, 'patient', appt.patientId] });
    },
  });
}

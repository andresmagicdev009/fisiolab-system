import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { patientsService, PatientsQueryParams } from 'services/patientsService';
import type { CreatePatientData, UpdatePatientData } from 'types/models';

const PATIENTS_KEY = 'patients';

// ─── List ─────────────────────────────────────────────────────────────────────

export function usePatients(params?: PatientsQueryParams) {
  return useQuery({
    queryKey: [PATIENTS_KEY, params],
    queryFn: () => patientsService.getAll(params),
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function usePatient(id: string) {
  return useQuery({
    queryKey: [PATIENTS_KEY, id],
    queryFn: () => patientsService.getOne(id),
    enabled: !!id,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreatePatientData) => patientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      toast({ title: 'Paciente creado', status: 'success', duration: 3000, isClosable: true });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Error al crear paciente';
      toast({
        title: Array.isArray(msg) ? msg[0] : msg,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientData }) =>
      patientsService.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY, updated.id] });
      toast({ title: 'Paciente actualizado', status: 'success', duration: 3000, isClosable: true });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Error al actualizar paciente';
      toast({
        title: Array.isArray(msg) ? msg[0] : msg,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeletePatient() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => patientsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      queryClient.removeQueries({ queryKey: [PATIENTS_KEY, id] });
      toast({ title: 'Paciente eliminado', status: 'success', duration: 3000, isClosable: true });
    },
    onError: () => {
      toast({ title: 'Error al eliminar paciente', status: 'error', duration: 3000, isClosable: true });
    },
  });
}

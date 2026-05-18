import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientService } from 'services/patientService';
import { CreatePatientData, UpdatePatientData } from 'types/models';

const QUERY_KEY = 'patients';

export function usePatients() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: patientService.getAll,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => patientService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePatientData) => patientService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePatientData }) =>
      patientService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

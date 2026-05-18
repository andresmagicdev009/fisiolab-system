import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { antecedenteService } from 'services/antecedenteService';
import {
  AntecedentesGineco,
  AntecedentesHeredofamiliar,
  AntecedentesNoPatologico,
  AntecedentesPatologico,
} from 'types/models';

const key = (patientId: string, tipo?: string) =>
  tipo ? ['antecedentes', patientId, tipo] : ['antecedentes', patientId];

export function useAntecedentesResumen(patientId: string) {
  return useQuery({
    queryKey: key(patientId),
    queryFn: () => antecedenteService.getAll(patientId),
    enabled: !!patientId,
  });
}

export function useHeredofamiliares(patientId: string, enabled = true) {
  return useQuery({
    queryKey: key(patientId, 'heredofamiliares'),
    queryFn: () => antecedenteService.getHeredofamiliares(patientId),
    enabled: !!patientId && enabled,
  });
}

export function useUpdateHeredofamiliares(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AntecedentesHeredofamiliar>) =>
      antecedenteService.updateHeredofamiliares(patientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(patientId, 'heredofamiliares') });
      qc.invalidateQueries({ queryKey: key(patientId) });
    },
  });
}

export function usePatologicos(patientId: string, enabled = true) {
  return useQuery({
    queryKey: key(patientId, 'patologicos'),
    queryFn: () => antecedenteService.getPatologicos(patientId),
    enabled: !!patientId && enabled,
  });
}

export function useUpdatePatologicos(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AntecedentesPatologico>) =>
      antecedenteService.updatePatologicos(patientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(patientId, 'patologicos') });
      qc.invalidateQueries({ queryKey: key(patientId) });
    },
  });
}

export function useNoPatologicos(patientId: string, enabled = true) {
  return useQuery({
    queryKey: key(patientId, 'no-patologicos'),
    queryFn: () => antecedenteService.getNoPatologicos(patientId),
    enabled: !!patientId && enabled,
  });
}

export function useUpdateNoPatologicos(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AntecedentesNoPatologico>) =>
      antecedenteService.updateNoPatologicos(patientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(patientId, 'no-patologicos') });
      qc.invalidateQueries({ queryKey: key(patientId) });
    },
  });
}

export function useGineco(patientId: string, enabled = true) {
  return useQuery({
    queryKey: key(patientId, 'gineco-obstetricos'),
    queryFn: () => antecedenteService.getGineco(patientId),
    enabled: !!patientId && enabled,
  });
}

export function useUpdateGineco(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AntecedentesGineco>) =>
      antecedenteService.updateGineco(patientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(patientId, 'gineco-obstetricos') });
      qc.invalidateQueries({ queryKey: key(patientId) });
    },
  });
}

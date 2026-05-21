import {
  Box,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import { useCurrentDbUser } from 'hooks/useCurrentUser';
import { useAppointmentsByPatient } from 'hooks/useAppointments';
import { useCreatePlan, useUpdatePlan } from 'hooks/usePlans';
import React, { useEffect, useState } from 'react';
import { MdCalendarToday, MdFitnessCenter } from 'react-icons/md';
import { ClinicalEpisode, CreatePlanDto, EstadoCita, TipoCita, TreatmentPlan, UpdatePlanDto } from 'types/models';

const TIPO_LABEL: Record<TipoCita, string> = {
  [TipoCita.PRIMERA_VEZ]: 'Primera vez',
  [TipoCita.SEGUIMIENTO]: 'Seguimiento',
  [TipoCita.INTERCONSULTA]: 'Interconsulta',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  episode: ClinicalEpisode;
  plan?: TreatmentPlan;
}

export default function TreatmentPlanFormModal({ isOpen, onClose, episode, plan }: Props) {
  const toast = useToast();
  const { data: currentUser } = useCurrentDbUser();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  const { data: apptResult } = useAppointmentsByPatient(episode.pacienteId, { limit: 100 });
  const confirmadas = apptResult?.data?.filter((a) => a.estado === EstadoCita.CONFIRMADA) ?? [];

  const isEdit = !!plan;

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const sectionColor = useColorModeValue('brand.500', 'brand.400');

  const [objetivo, setObjetivo] = useState('');
  const [duracion, setDuracion] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [objetivoError, setObjetivoError] = useState('');
  const [fechaError, setFechaError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        setObjetivo(plan.objetivoTerapeutico);
        setDuracion(plan.duracionEstimadaSemanas?.toString() ?? '');
        setFrecuencia(plan.frecuenciaSemanal?.toString() ?? '');
        setFechaInicio(plan.fechaInicio ?? '');
        setFechaFin(plan.fechaFin ?? '');
        setAppointmentId(plan.appointmentId ?? '');
        setObservaciones(plan.observaciones ?? '');
      } else {
        setObjetivo('');
        setDuracion('');
        setFrecuencia('');
        setFechaInicio('');
        setFechaFin('');
        setAppointmentId('');
        setObservaciones('');
      }
      setObjetivoError('');
      setFechaError('');
    }
  }, [isOpen, plan]);

  const validate = () => {
    let ok = true;
    if (objetivo.trim().length < 10) { setObjetivoError('Mínimo 10 caracteres'); ok = false; }
    else if (objetivo.trim().length > 1000) { setObjetivoError('Máximo 1000 caracteres'); ok = false; }
    else setObjetivoError('');

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      setFechaError('Fecha fin debe ser ≥ fecha inicio');
      ok = false;
    } else setFechaError('');

    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!currentUser?.id) {
      toast({ title: 'Error de sesión', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const payload: UpdatePlanDto = {
          objetivoTerapeutico: objetivo.trim(),
          ...(duracion ? { duracionEstimadaSemanas: Number(duracion) } : {}),
          ...(frecuencia ? { frecuenciaSemanal: Number(frecuencia) } : {}),
          ...(fechaInicio ? { fechaInicio } : {}),
          ...(fechaFin ? { fechaFin } : {}),
          ...(appointmentId ? { appointmentId } : {}),
          ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
        };
        await updatePlan.mutateAsync({ patientId: episode.pacienteId, episodeId: episode.id, planId: plan!.id, payload });
        toast({ title: 'Plan actualizado', status: 'success', duration: 2500, isClosable: true, position: 'top-right' });
      } else {
        const payload: CreatePlanDto = {
          profesionalId: currentUser.id,
          objetivoTerapeutico: objetivo.trim(),
          ...(duracion ? { duracionEstimadaSemanas: Number(duracion) } : {}),
          ...(frecuencia ? { frecuenciaSemanal: Number(frecuencia) } : {}),
          ...(fechaInicio ? { fechaInicio } : {}),
          ...(fechaFin ? { fechaFin } : {}),
          ...(appointmentId ? { appointmentId } : {}),
          ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
        };
        await createPlan.mutateAsync({ patientId: episode.pacienteId, episodeId: episode.id, payload });
        toast({ title: 'Plan de tratamiento creado', status: 'success', duration: 2500, isClosable: true, position: 'top-right' });
      }
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar el plan';
      toast({ title: 'Error', description: msg, status: 'error', duration: 5000, isClosable: true, position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='lg' scrollBehavior='inside'>
      <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
      <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
        <ModalHeader pb='0'>
          <Flex align='center' gap='12px' mb='4px'>
            <Flex w='40px' h='40px' bg='brand.500' borderRadius='12px' align='center' justify='center' flexShrink={0}>
              <Icon as={MdFitnessCenter} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>
                {isEdit ? 'Editar Plan de Tratamiento' : 'Nuevo Plan de Tratamiento'}
              </Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {episode.codigoHc} — {episode.motivoConsulta.slice(0, 50)}{episode.motivoConsulta.length > 50 ? '…' : ''}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          <form id='plan-form' onSubmit={handleSubmit}>
            <Text color={sectionColor} fontSize='xs' fontWeight='800' textTransform='uppercase' letterSpacing='wider' mb='12px'>
              Objetivo Terapéutico
            </Text>
            <FormControl isInvalid={!!objetivoError} mb='20px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Objetivo{' '}
                <Text as='span' fontWeight='400' color={mutedColor}>(requerido, 10–1000 chars)</Text>
              </FormLabel>
              <Textarea
                value={objetivo}
                onChange={(e) => { setObjetivo(e.target.value); if (objetivoError) setObjetivoError(''); }}
                placeholder='Ej: Reducir dolor lumbar de EVA 7 a EVA 2, restaurar rango de movimiento normal...'
                rows={3}
                bg={inputBg}
                border='1px solid'
                borderColor={objetivoError ? 'red.400' : inputBorder}
                borderRadius='16px'
                fontSize='sm'
                resize='vertical'
                _focus={{ borderColor: objetivoError ? 'red.400' : 'brand.500', boxShadow: 'none' }}
              />
              {objetivoError
                ? <FormErrorMessage ms='10px'>{objetivoError}</FormErrorMessage>
                : <Text mt='4px' ms='10px' fontSize='xs' color={mutedColor}>{objetivo.length}/1000</Text>}
            </FormControl>

            <Divider mb='20px' />

            <Text color={sectionColor} fontSize='xs' fontWeight='800' textTransform='uppercase' letterSpacing='wider' mb='12px'>
              Parámetros del Plan
            </Text>

            <Grid templateColumns='1fr 1fr' gap='16px' mb='16px'>
              <FormControl>
                <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                  Duración{' '}
                  <Text as='span' fontWeight='400' color={mutedColor}>(semanas)</Text>
                </FormLabel>
                <Input
                  type='number' min={1} max={52}
                  value={duracion}
                  onChange={(e) => setDuracion(e.target.value)}
                  placeholder='Ej: 6'
                  bg={inputBg} border='1px solid' borderColor={inputBorder}
                  borderRadius='16px' fontSize='sm'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                  Frecuencia{' '}
                  <Text as='span' fontWeight='400' color={mutedColor}>(ses/semana)</Text>
                </FormLabel>
                <Input
                  type='number' min={1} max={7}
                  value={frecuencia}
                  onChange={(e) => setFrecuencia(e.target.value)}
                  placeholder='Ej: 3'
                  bg={inputBg} border='1px solid' borderColor={inputBorder}
                  borderRadius='16px' fontSize='sm'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                />
              </FormControl>
            </Grid>

            <FormControl isInvalid={!!fechaError} mb='16px'>
              <Grid templateColumns='1fr 1fr' gap='16px'>
                <Box>
                  <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                    Fecha inicio <Text as='span' fontWeight='400' color={mutedColor}>(opcional)</Text>
                  </FormLabel>
                  <Input
                    type='date'
                    value={fechaInicio}
                    onChange={(e) => { setFechaInicio(e.target.value); if (fechaError) setFechaError(''); }}
                    bg={inputBg} border='1px solid' borderColor={fechaError ? 'red.400' : inputBorder}
                    borderRadius='16px' fontSize='sm'
                    _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                  />
                </Box>
                <Box>
                  <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                    Fecha fin <Text as='span' fontWeight='400' color={mutedColor}>(opcional)</Text>
                  </FormLabel>
                  <Input
                    type='date'
                    value={fechaFin}
                    onChange={(e) => { setFechaFin(e.target.value); if (fechaError) setFechaError(''); }}
                    bg={inputBg} border='1px solid' borderColor={fechaError ? 'red.400' : inputBorder}
                    borderRadius='16px' fontSize='sm'
                    _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                  />
                </Box>
              </Grid>
              {fechaError && <FormErrorMessage ms='10px'>{fechaError}</FormErrorMessage>}
            </FormControl>

            <FormControl mb='16px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                <Flex align='center' gap='6px'>
                  <Icon as={MdCalendarToday} w='14px' h='14px' color={sectionColor} />
                  Cita de inicio{' '}
                  <Text as='span' fontWeight='400' color={mutedColor}>(opcional)</Text>
                </Flex>
              </FormLabel>
              <Select
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder='Sin cita asociada'
                bg={inputBg}
                border='1px solid'
                borderColor={inputBorder}
                borderRadius='16px'
                fontSize='sm'
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              >
                {confirmadas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {new Date(a.scheduledAt).toLocaleDateString('es-EC', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })} — {TIPO_LABEL[a.tipoCita]}
                  </option>
                ))}
              </Select>
              {confirmadas.length === 0 && (
                <Text mt='4px' ms='10px' fontSize='xs' color={mutedColor}>
                  No hay citas confirmadas para este paciente
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Observaciones <Text as='span' fontWeight='400' color={mutedColor}>(opcional)</Text>
              </FormLabel>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder='Notas adicionales sobre el plan...'
                rows={3}
                maxLength={1000}
                bg={inputBg} border='1px solid' borderColor={inputBorder}
                borderRadius='16px' fontSize='sm' resize='vertical'
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              />
            </FormControl>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>Cancelar</Button>
          <Button
            type='submit'
            form='plan-form'
            isLoading={isSubmitting}
            leftIcon={<Icon as={MdFitnessCenter} />}>
            {isEdit ? 'Guardar cambios' : 'Crear Plan'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

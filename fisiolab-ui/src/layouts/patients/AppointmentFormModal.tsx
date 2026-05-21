import {
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
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
import { useCreateAppointment, useUpdateAppointment } from 'hooks/useAppointments';
import { useAllUsers } from 'hooks/useUsers';
import React, { useEffect, useState } from 'react';
import { MdCalendarToday } from 'react-icons/md';
import {
  Appointment,
  CreateAppointmentDto,
  TipoCita,
  UpdateAppointmentDto,
} from 'types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  appointment?: Appointment;
  isAdmin?: boolean;
}

export default function AppointmentFormModal({
  isOpen, onClose, patientId, appointment, isAdmin = false,
}: Props) {
  const toast = useToast();
  const { data: currentUser } = useCurrentDbUser();
  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();
  const { data: allUsers = [] } = useAllUsers(isAdmin);

  const isEdit = !!appointment;

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const sectionColor = useColorModeValue('brand.500', 'brand.400');

  const professionals = allUsers.filter((u) =>
    ['admin', 'medico', 'fisioterapeuta'].includes(u.role),
  );

  const [professionalId, setProfessionalId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [tipoCita, setTipoCita] = useState<TipoCita>(TipoCita.PRIMERA_VEZ);
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (appointment) {
      setProfessionalId(appointment.professionalId);
      // Convert ISO to datetime-local format
      const d = new Date(appointment.scheduledAt);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setScheduledAt(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      );
      setDurationMinutes(appointment.durationMinutes.toString());
      setTipoCita(appointment.tipoCita);
      setMotivo(appointment.motivo ?? '');
      setNotas(appointment.notas ?? '');
    } else {
      setProfessionalId(currentUser?.id ?? '');
      setScheduledAt('');
      setDurationMinutes('60');
      setTipoCita(TipoCita.PRIMERA_VEZ);
      setMotivo('');
      setNotas('');
    }
    setErrors({});
  }, [isOpen, appointment, currentUser]);

  // Keep professionalId in sync when currentUser loads (create mode)
  useEffect(() => {
    if (!isEdit && !professionalId && currentUser?.id) {
      setProfessionalId(currentUser.id);
    }
  }, [currentUser, isEdit, professionalId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!scheduledAt) e.scheduledAt = 'Fecha y hora requeridas';
    else if (new Date(scheduledAt) <= new Date()) e.scheduledAt = 'No puede ser en el pasado';
    if (!professionalId) e.professionalId = 'Profesional requerido';
    if (!isEdit && !patientId) e.patientId = 'Paciente requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const payload: UpdateAppointmentDto = {
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes: Number(durationMinutes),
          professionalId,
          ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
          ...(notas.trim() ? { notas: notas.trim() } : {}),
        };
        await updateAppt.mutateAsync({ id: appointment!.id, payload });
        toast({ title: 'Cita actualizada', status: 'success', duration: 2500, isClosable: true, position: 'top-right' });
      } else {
        const payload: CreateAppointmentDto = {
          patientId: patientId!,
          professionalId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          tipoCita,
          durationMinutes: Number(durationMinutes),
          ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
          ...(notas.trim() ? { notas: notas.trim() } : {}),
        };
        await createAppt.mutateAsync(payload);
        toast({ title: 'Cita agendada', status: 'success', duration: 2500, isClosable: true, position: 'top-right' });
      }
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 409
          ? 'Conflicto de horario: el profesional ya tiene una cita en ese horario'
          : status === 422
          ? 'El paciente no tiene tarjetero activo'
          : err?.response?.data?.message ?? 'Error al guardar la cita';
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
            <Flex w='40px' h='40px' bg='blue.500' borderRadius='12px' align='center' justify='center' flexShrink={0}>
              <Icon as={MdCalendarToday} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>
                {isEdit ? 'Editar Cita' : 'Agendar Cita'}
              </Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {isEdit ? `Cita — ${appointment?.tipoCita}` : 'Nueva cita clínica'}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          <form id='appt-form' onSubmit={handleSubmit}>
            <Text color={sectionColor} fontSize='xs' fontWeight='800' textTransform='uppercase' letterSpacing='wider' mb='12px'>
              Datos de la cita
            </Text>

            {/* Tipo de cita — solo en crear */}
            {!isEdit && (
              <FormControl mb='16px'>
                <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>Tipo de cita</FormLabel>
                <Select
                  value={tipoCita}
                  onChange={(e) => setTipoCita(e.target.value as TipoCita)}
                  bg={inputBg} border='1px solid' borderColor={inputBorder}
                  borderRadius='16px' fontSize='sm'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}>
                  <option value={TipoCita.PRIMERA_VEZ}>Primera vez</option>
                  <option value={TipoCita.SEGUIMIENTO}>Seguimiento</option>
                  <option value={TipoCita.INTERCONSULTA}>Interconsulta</option>
                </Select>
              </FormControl>
            )}

            {/* Profesional */}
            <FormControl isInvalid={!!errors.professionalId} mb='16px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>Profesional</FormLabel>
              {isAdmin && professionals.length > 0 ? (
                <Select
                  value={professionalId}
                  onChange={(e) => setProfessionalId(e.target.value)}
                  bg={inputBg} border='1px solid' borderColor={errors.professionalId ? 'red.400' : inputBorder}
                  borderRadius='16px' fontSize='sm'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}>
                  <option value=''>Seleccionar profesional...</option>
                  {professionals.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombres && u.apellidos ? `${u.nombres} ${u.apellidos}` : u.email} ({u.role})
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={
                    currentUser?.nombres
                      ? `${currentUser.nombres} ${currentUser.apellidos ?? ''}`
                      : currentUser?.email ?? ''
                  }
                  isReadOnly
                  bg={inputBg} border='1px solid' borderColor={inputBorder}
                  borderRadius='16px' fontSize='sm'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                />
              )}
              {errors.professionalId && <FormErrorMessage ms='10px'>{errors.professionalId}</FormErrorMessage>}
            </FormControl>

            {/* Fecha/hora */}
            <FormControl isInvalid={!!errors.scheduledAt} mb='16px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Fecha y hora <Text as='span' fontWeight='400' color={mutedColor}>(requerido)</Text>
              </FormLabel>
              <Input
                type='datetime-local'
                value={scheduledAt}
                onChange={(e) => { setScheduledAt(e.target.value); if (errors.scheduledAt) setErrors((p) => ({ ...p, scheduledAt: '' })); }}
                bg={inputBg} border='1px solid' borderColor={errors.scheduledAt ? 'red.400' : inputBorder}
                borderRadius='16px' fontSize='sm'
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              />
              {errors.scheduledAt && <FormErrorMessage ms='10px'>{errors.scheduledAt}</FormErrorMessage>}
            </FormControl>

            {/* Duración */}
            <FormControl mb='16px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Duración <Text as='span' fontWeight='400' color={mutedColor}>(minutos)</Text>
              </FormLabel>
              <Select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                bg={inputBg} border='1px solid' borderColor={inputBorder}
                borderRadius='16px' fontSize='sm'
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}>
                {[15, 30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} minutos</option>
                ))}
              </Select>
            </FormControl>

            {/* Motivo */}
            <FormControl mb='16px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Motivo <Text as='span' fontWeight='400' color={mutedColor}>(opcional)</Text>
              </FormLabel>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder='Ej: Dolor lumbar, control post-operatorio...'
                rows={2}
                maxLength={500}
                bg={inputBg} border='1px solid' borderColor={inputBorder}
                borderRadius='16px' fontSize='sm' resize='vertical'
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              />
            </FormControl>

            {/* Notas */}
            <FormControl>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Notas internas <Text as='span' fontWeight='400' color={mutedColor}>(opcional)</Text>
              </FormLabel>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder='Notas para el profesional...'
                rows={2}
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
            form='appt-form'
            colorScheme='blue'
            isLoading={isSubmitting}
            leftIcon={<Icon as={MdCalendarToday} />}>
            {isEdit ? 'Guardar cambios' : 'Agendar Cita'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

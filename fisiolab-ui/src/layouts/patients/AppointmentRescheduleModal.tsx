import {
  Box,
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
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import { useRescheduleAppointment } from 'hooks/useAppointments';
import React, { useEffect, useState } from 'react';
import { MdArrowForward, MdEventRepeat } from 'react-icons/md';
import { Appointment } from 'types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

function formatDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplay(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AppointmentRescheduleModal({ isOpen, onClose, appointment }: Props) {
  const toast = useToast();
  const reschedule = useRescheduleAppointment();

  const [scheduledAt, setScheduledAt] = useState('');
  const [motivo, setMotivo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const arrowBg = useColorModeValue('gray.50', 'navy.700');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  useEffect(() => {
    if (isOpen) {
      setScheduledAt('');
      setMotivo('');
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!scheduledAt) {
      e.scheduledAt = 'La nueva fecha es requerida';
    } else if (new Date(scheduledAt) <= new Date()) {
      e.scheduledAt = 'La fecha debe ser en el futuro';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await reschedule.mutateAsync({
        id: appointment.id,
        payload: {
          scheduledAt: new Date(scheduledAt).toISOString(),
          ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
        },
      });
      toast({
        title: 'Cita reprogramada',
        description: `Nueva cita: ${formatDisplay(res.nueva.scheduledAt)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al reprogramar la cita';
      toast({ title: 'Error', description: msg, status: 'error', duration: 5000, isClosable: true, position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='md'>
      <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
      <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
        <ModalHeader pb='0'>
          <Flex align='center' gap='12px' mb='4px'>
            <Flex
              w='40px' h='40px' bg='purple.500' borderRadius='12px'
              align='center' justify='center' flexShrink={0}>
              <Icon as={MdEventRepeat} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>Reprogramar Cita</Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {appointment.patient.nombres} {appointment.patient.apellidos}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          {/* Current → new date visual */}
          <Flex
            bg={arrowBg}
            borderRadius='12px'
            px='14px'
            py='10px'
            align='center'
            gap='10px'
            mb='20px'
            border='1px solid'
            borderColor={dividerColor}>
            <Box flex={1} minW={0}>
              <Text fontSize='9px' fontWeight='800' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em' mb='2px'>
                Cita actual
              </Text>
              <Text fontSize='xs' fontWeight='600' color={textColor} noOfLines={2}>
                {formatDisplay(appointment.scheduledAt)}
              </Text>
            </Box>
            <Icon as={MdArrowForward} color='purple.400' w='18px' h='18px' flexShrink={0} />
            <Box flex={1} minW={0}>
              <Text fontSize='9px' fontWeight='800' color='purple.500' textTransform='uppercase' letterSpacing='0.08em' mb='2px'>
                Nueva fecha
              </Text>
              <Text fontSize='xs' fontWeight='600' color={scheduledAt ? textColor : mutedColor} noOfLines={2}>
                {scheduledAt ? formatDisplay(new Date(scheduledAt).toISOString()) : 'Sin seleccionar'}
              </Text>
            </Box>
          </Flex>

          <form id='reschedule-form' onSubmit={handleSubmit}>
            <FormControl isInvalid={!!errors.scheduledAt} mb='20px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Nueva fecha y hora <Text as='span' color='red.400'>*</Text>
              </FormLabel>
              <Input
                type='datetime-local'
                value={scheduledAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => {
                  setScheduledAt(e.target.value);
                  if (errors.scheduledAt) setErrors((p) => ({ ...p, scheduledAt: '' }));
                }}
                bg={inputBg}
                border='1px solid'
                borderColor={errors.scheduledAt ? 'red.400' : inputBorder}
                borderRadius='16px'
                fontSize='sm'
                _focus={{ borderColor: 'purple.400', boxShadow: 'none' }}
              />
              {errors.scheduledAt && <FormErrorMessage ms='10px'>{errors.scheduledAt}</FormErrorMessage>}
            </FormControl>

            <FormControl>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Motivo de reprogramación{' '}
                <Text as='span' fontWeight='400' color={mutedColor}>(opcional)</Text>
              </FormLabel>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder='Ej: Paciente solicitó cambio de horario, conflicto de agenda...'
                rows={3}
                maxLength={500}
                bg={inputBg}
                border='1px solid'
                borderColor={inputBorder}
                borderRadius='16px'
                fontSize='sm'
                resize='vertical'
                _focus={{ borderColor: 'purple.400', boxShadow: 'none' }}
              />
              <Text mt='4px' ms='10px' fontSize='xs' color={mutedColor}>
                {motivo.length}/500 — Se genera una nueva cita CONFIRMADA y esta queda REPROGRAMADA.
              </Text>
            </FormControl>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>Cancelar</Button>
          <Button
            type='submit'
            form='reschedule-form'
            colorScheme='purple'
            isLoading={isSubmitting}
            leftIcon={<Icon as={MdEventRepeat} />}>
            Reprogramar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

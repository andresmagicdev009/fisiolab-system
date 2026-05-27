import {
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
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
import { useCancelAppointment } from 'hooks/useAppointments';
import React, { useEffect, useState } from 'react';
import { MdClose, MdWarning } from 'react-icons/md';
import { Appointment } from 'types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

export default function AppointmentCancelModal({ isOpen, onClose, appointment }: Props) {
  const toast = useToast();
  const cancelAppt = useCancelAppointment();

  const [motivo, setMotivo] = useState('');
  const [motivoError, setMotivoError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  useEffect(() => {
    if (isOpen) { setMotivo(''); setMotivoError(''); }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 5) { setMotivoError('Mínimo 5 caracteres'); return; }
    setMotivoError('');
    setIsSubmitting(true);
    try {
      await cancelAppt.mutateAsync({ id: appointment.id, payload: { motivoCancelacion: motivo.trim() } });
      toast({ title: 'Cita cancelada', status: 'info', duration: 2500, isClosable: true, position: 'top-right' });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al cancelar la cita';
      toast({ title: 'Error', description: msg, status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
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
            <Flex w='40px' h='40px' bg='red.500' borderRadius='12px' align='center' justify='center' flexShrink={0}>
              <Icon as={MdClose} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>Cancelar Cita</Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>Esta acción no se puede revertir</Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='16px' pb='6'>
          {/* Warning */}
          <Flex
            bg={useColorModeValue('orange.50', 'orange.900')}
            border='1px solid'
            borderColor={useColorModeValue('orange.200', 'orange.700')}
            borderRadius='10px'
            px='12px' py='10px' align='center' gap='8px' mb='16px'>
            <Icon as={MdWarning} color='orange.400' w='16px' h='16px' flexShrink={0} />
            <Text fontSize='xs' color='orange.700' fontWeight='600'>
              {appointment.patient.nombres} {appointment.patient.apellidos} — {new Date(appointment.scheduledAt).toLocaleString('es')}
            </Text>
          </Flex>

          <form id='cancel-form' onSubmit={handleSubmit}>
            <FormControl isInvalid={!!motivoError}>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Motivo de cancelación <Text as='span' fontWeight='400' color={mutedColor}>(requerido)</Text>
              </FormLabel>
              <Textarea
                value={motivo}
                onChange={(e) => { setMotivo(e.target.value); if (motivoError) setMotivoError(''); }}
                placeholder='Ej: Paciente no se presentó, reagendamiento solicitado...'
                rows={3}
                maxLength={500}
                bg={inputBg} border='1px solid'
                borderColor={motivoError ? 'red.400' : inputBorder}
                borderRadius='16px' fontSize='sm' resize='vertical'
                _focus={{ borderColor: motivoError ? 'red.400' : 'brand.500', boxShadow: 'none' }}
              />
              {motivoError
                ? <FormErrorMessage ms='10px'>{motivoError}</FormErrorMessage>
                : <Text mt='4px' ms='10px' fontSize='xs' color={mutedColor}>{motivo.length}/500</Text>}
            </FormControl>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>Volver</Button>
          <Button
            type='submit'
            form='cancel-form'
            colorScheme='red'
            isLoading={isSubmitting}
            leftIcon={<Icon as={MdClose} />}>
            Cancelar Cita
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

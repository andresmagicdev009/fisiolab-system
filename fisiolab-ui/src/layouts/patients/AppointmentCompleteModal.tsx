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
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import { useCompleteAppointment } from 'hooks/useAppointments';
import { useEpisodesByPatient } from 'hooks/useEpisodes';
import { usePlansByEpisode } from 'hooks/usePlans';
import React, { useEffect, useState } from 'react';
import { MdCheckCircle, MdFitnessCenter } from 'react-icons/md';
import { Appointment, EstadoEpisodio, EstadoPlan, TipoCita } from 'types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

export default function AppointmentCompleteModal({ isOpen, onClose, appointment }: Props) {
  const toast = useToast();
  const completeAppt = useCompleteAppointment();
  const { data: episodes = [] } = useEpisodesByPatient(appointment.patientId);

  const activeEpisodes = episodes.filter(
    (e) => e.estado === EstadoEpisodio.ABIERTO || e.estado === EstadoEpisodio.EN_TRATAMIENTO,
  );

  const needsEpisode =
    appointment.tipoCita === TipoCita.SEGUIMIENTO ||
    appointment.tipoCita === TipoCita.INTERCONSULTA;

  const [monto, setMonto] = useState('');
  const [episodeId, setEpisodeId] = useState('');
  const [planId, setPlanId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: activePlans = [] } = usePlansByEpisode(appointment.patientId, episodeId);
  const activePlanOptions = activePlans.filter((p) => p.estado === EstadoPlan.ACTIVO);

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const sectionColor = useColorModeValue('teal.500', 'teal.400');

  useEffect(() => {
    if (isOpen) {
      setMonto('');
      setEpisodeId('');
      setPlanId('');
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!monto || Number(monto) <= 0) e.monto = 'Monto requerido y mayor a 0';
    if (needsEpisode && !episodeId) e.episodeId = 'Episodio requerido para este tipo de cita';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await completeAppt.mutateAsync({
        id: appointment.id,
        payload: {
          monto: Number(monto),
          ...(episodeId ? { episodeId } : {}),
          ...(planId ? { planId } : {}),
        },
      });
      const desc = res.sessionId
        ? `Cobro generado. Sesión #${res.sessionId.slice(0, 8)} creada automáticamente.`
        : 'Cobro de sesión generado.';
      toast({ title: 'Cita completada', description: desc, status: 'success', duration: 4000, isClosable: true, position: 'top-right' });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al completar la cita';
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
            <Flex w='40px' h='40px' bg='green.500' borderRadius='12px' align='center' justify='center' flexShrink={0}>
              <Icon as={MdCheckCircle} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>Completar Cita</Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {appointment.patient.nombres} {appointment.patient.apellidos}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          <form id='complete-form' onSubmit={handleSubmit}>
            {/* Monto */}
            <Text color={sectionColor} fontSize='xs' fontWeight='800' textTransform='uppercase' letterSpacing='wider' mb='12px'>
              Cobro de sesión
            </Text>
            <FormControl isInvalid={!!errors.monto} mb='20px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Monto (USD) <Text as='span' fontWeight='400' color={mutedColor}>(requerido)</Text>
              </FormLabel>
              <Input
                type='number'
                min={0.01}
                step={0.01}
                value={monto}
                onChange={(e) => { setMonto(e.target.value); if (errors.monto) setErrors((p) => ({ ...p, monto: '' })); }}
                placeholder='0.00'
                bg={inputBg} border='1px solid'
                borderColor={errors.monto ? 'red.400' : inputBorder}
                borderRadius='16px' fontSize='sm'
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              />
              {errors.monto && <FormErrorMessage ms='10px'>{errors.monto}</FormErrorMessage>}
            </FormControl>

            {/* Episodio */}
            <Text color={sectionColor} fontSize='xs' fontWeight='800' textTransform='uppercase' letterSpacing='wider' mb='12px'>
              Episodio Clínico
            </Text>
            <FormControl isInvalid={!!errors.episodeId}>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Vincular episodio{' '}
                <Text as='span' fontWeight='400' color={mutedColor}>
                  {needsEpisode ? '(requerido)' : '(opcional para primera vez)'}
                </Text>
              </FormLabel>
              <Select
                value={episodeId}
                onChange={(e) => { setEpisodeId(e.target.value); if (errors.episodeId) setErrors((p) => ({ ...p, episodeId: '' })); }}
                bg={inputBg} border='1px solid'
                borderColor={errors.episodeId ? 'red.400' : inputBorder}
                borderRadius='16px' fontSize='sm'
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}>
                <option value=''>
                  {appointment.tipoCita === TipoCita.PRIMERA_VEZ
                    ? 'Sin episodio (abrir manualmente después)'
                    : 'Seleccionar episodio activo...'}
                </option>
                {activeEpisodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.codigoHc} — {ep.motivoConsulta.slice(0, 50)}
                  </option>
                ))}
              </Select>
              {errors.episodeId && <FormErrorMessage ms='10px'>{errors.episodeId}</FormErrorMessage>}
              {activeEpisodes.length === 0 && needsEpisode && (
                <Text mt='6px' ms='10px' fontSize='xs' color='orange.500' fontWeight='600'>
                  Sin episodios activos — crea uno desde Historia Clínica primero
                </Text>
              )}
            </FormControl>

            {/* Plan — solo visible si hay episodio seleccionado y planes activos */}
            {episodeId && activePlanOptions.length > 0 && (
              <>
                <Text color={sectionColor} fontSize='xs' fontWeight='800' textTransform='uppercase' letterSpacing='wider' mb='12px' mt='20px'>
                  Plan de Tratamiento
                </Text>
                <FormControl>
                  <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                    Vincular plan{' '}
                    <Flex as='span' align='center' gap='4px' display='inline-flex'>
                      <Icon as={MdFitnessCenter} w='12px' h='12px' color={mutedColor} />
                      <Text as='span' fontWeight='400' color={mutedColor}>(opcional — crea sesión automática)</Text>
                    </Flex>
                  </FormLabel>
                  <Select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    bg={inputBg}
                    border='1px solid'
                    borderColor={inputBorder}
                    borderRadius='16px'
                    fontSize='sm'
                    _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}>
                    <option value=''>Sin plan (sin sesión automática)</option>
                    {activePlanOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        Plan #{p.numeroPlan} — {p.objetivoTerapeutico.slice(0, 50)}
                      </option>
                    ))}
                  </Select>
                  <Text mt='4px' ms='10px' fontSize='xs' color={mutedColor}>
                    Al seleccionar un plan se crea una sesión FISIOTERAPIA automáticamente.
                  </Text>
                </FormControl>
              </>
            )}
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>Cancelar</Button>
          <Button
            type='submit'
            form='complete-form'
            colorScheme='green'
            isLoading={isSubmitting}
            leftIcon={<Icon as={MdCheckCircle} />}>
            Completar y cobrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

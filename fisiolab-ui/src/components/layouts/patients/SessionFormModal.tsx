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
import { useCreateSession } from 'hooks/useSessions';
import React, { useEffect, useState } from 'react';
import { MdEventNote } from 'react-icons/md';
import { ClinicalEpisode, CreateSessionDto, TipoSesion, TreatmentPlan } from 'types/models';

const TIPO_OPTIONS: { value: TipoSesion; label: string }[] = [
  { value: TipoSesion.FISIOTERAPIA, label: 'Fisioterapia' },
  { value: TipoSesion.EVALUACION_FISICA, label: 'Evaluación Física' },
  { value: TipoSesion.INTERCONSULTA, label: 'Interconsulta' },
  { value: TipoSesion.CONSULTA_MEDICA, label: 'Consulta Médica' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plan: TreatmentPlan;
  episode: ClinicalEpisode;
}

export default function SessionFormModal({ isOpen, onClose, plan, episode }: Props) {
  const toast = useToast();
  const { data: currentUser } = useCurrentDbUser();
  const createSession = useCreateSession();

  const today = new Date().toISOString().split('T')[0];

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  const [tipo, setTipo] = useState<TipoSesion>(TipoSesion.FISIOTERAPIA);
  const [fechaSesion, setFechaSesion] = useState(today);
  const [observaciones, setObservaciones] = useState('');
  const [tipoError, setTipoError] = useState('');
  const [fechaError, setFechaError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTipo(TipoSesion.FISIOTERAPIA);
      setFechaSesion(today);
      setObservaciones('');
      setTipoError('');
      setFechaError('');
    }
  }, [isOpen]);

  const validate = () => {
    let ok = true;
    if (!tipo) { setTipoError('Selecciona el tipo de sesión'); ok = false; }
    else setTipoError('');
    if (!fechaSesion) { setFechaError('La fecha es requerida'); ok = false; }
    else if (fechaSesion > today) { setFechaError('La fecha no puede ser futura'); ok = false; }
    else setFechaError('');
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
      const payload: CreateSessionDto = {
        tipo,
        fechaSesion,
        profesionalId: currentUser.id,
        ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
      };
      await createSession.mutateAsync({
        patientId: episode.pacienteId,
        episodeId: episode.id,
        planId: plan.id,
        payload,
      });
      toast({
        title: 'Sesión registrada',
        status: 'success',
        duration: 2500,
        isClosable: true,
        position: 'top-right',
      });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al registrar la sesión';
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
              w='40px' h='40px' bg='teal.500' borderRadius='12px'
              align='center' justify='center' flexShrink={0}>
              <Icon as={MdEventNote} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>Nueva Sesión</Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                Plan #{plan.numeroPlan} — {plan.objetivoTerapeutico.slice(0, 45)}
                {plan.objetivoTerapeutico.length > 45 ? '…' : ''}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          <form id='session-form' onSubmit={handleSubmit}>
            <FormControl isInvalid={!!tipoError} mb='16px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Tipo de sesión
              </FormLabel>
              <Select
                value={tipo}
                onChange={(e) => { setTipo(e.target.value as TipoSesion); setTipoError(''); }}
                bg={inputBg}
                border='1px solid'
                borderColor={tipoError ? 'red.400' : inputBorder}
                borderRadius='16px'
                fontSize='sm'
                _focus={{ borderColor: 'teal.500', boxShadow: 'none' }}>
                {TIPO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
              {tipoError && <FormErrorMessage ms='10px'>{tipoError}</FormErrorMessage>}
            </FormControl>

            <FormControl isInvalid={!!fechaError} mb='16px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Fecha de sesión
              </FormLabel>
              <Input
                type='date'
                value={fechaSesion}
                max={today}
                onChange={(e) => { setFechaSesion(e.target.value); setFechaError(''); }}
                bg={inputBg}
                border='1px solid'
                borderColor={fechaError ? 'red.400' : inputBorder}
                borderRadius='16px'
                fontSize='sm'
                _focus={{ borderColor: 'teal.500', boxShadow: 'none' }}
              />
              {fechaError
                ? <FormErrorMessage ms='10px'>{fechaError}</FormErrorMessage>
                : <Text mt='4px' ms='10px' fontSize='xs' color={mutedColor}>No puede ser una fecha futura</Text>}
            </FormControl>

            <FormControl>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Observaciones{' '}
                <Text as='span' fontWeight='400' color={mutedColor}>(opcional)</Text>
              </FormLabel>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder='Notas sobre esta sesión...'
                rows={3}
                maxLength={500}
                bg={inputBg}
                border='1px solid'
                borderColor={inputBorder}
                borderRadius='16px'
                fontSize='sm'
                resize='vertical'
                _focus={{ borderColor: 'teal.500', boxShadow: 'none' }}
              />
              <Text mt='4px' ms='10px' fontSize='xs' color={mutedColor}>
                {observaciones.length}/500
              </Text>
            </FormControl>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>Cancelar</Button>
          <Button
            type='submit'
            form='session-form'
            isLoading={isSubmitting}
            colorScheme='teal'
            leftIcon={<Icon as={MdEventNote} />}>
            Registrar Sesión
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

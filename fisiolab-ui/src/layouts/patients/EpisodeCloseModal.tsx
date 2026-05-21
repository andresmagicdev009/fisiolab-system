import {
  Divider,
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
import FormField from 'components/ui/FormField';
import { useCloseEpisode } from 'hooks/useEpisodes';
import React, { useEffect, useRef, useState } from 'react';
import { MdCheckCircle } from 'react-icons/md';
import { ClinicalEpisode } from 'types/models';

interface EpisodeCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: ClinicalEpisode;
}

const CIE10_REGEX = /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/;

export default function EpisodeCloseModal({
  isOpen,
  onClose,
  episode,
}: EpisodeCloseModalProps) {
  const toast = useToast();
  const closeEpisode = useCloseEpisode();
  const notaCierreRef = useRef<HTMLTextAreaElement>(null);

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const sectionColor = useColorModeValue('brand.500', 'brand.400');
  const textareaVariantBg = useColorModeValue('gray.50', 'navy.700');
  const textareaBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  const [notaCierre, setNotaCierre] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [cie10, setCie10] = useState('');
  const [notaError, setNotaError] = useState('');
  const [cie10Error, setCie10Error] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotaCierre('');
      setDiagnostico(episode.diagnosticoPrincipal ?? '');
      setCie10(episode.codigoCie10 ?? '');
      setNotaError('');
      setCie10Error('');
      setTimeout(() => notaCierreRef.current?.focus(), 100);
    }
  }, [isOpen, episode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (notaCierre.trim().length < 10) {
      setNotaError('Mínimo 10 caracteres');
      valid = false;
    } else if (notaCierre.trim().length > 2000) {
      setNotaError('Máximo 2000 caracteres');
      valid = false;
    } else {
      setNotaError('');
    }

    if (cie10.trim() && !CIE10_REGEX.test(cie10.trim().toUpperCase())) {
      setCie10Error('Formato inválido. Ej: M51.1 o A00');
      valid = false;
    } else {
      setCie10Error('');
    }

    if (!valid) return;

    setIsSubmitting(true);
    try {
      await closeEpisode.mutateAsync({
        patientId: episode.pacienteId,
        episodeId: episode.id,
        payload: {
          notaCierre: notaCierre.trim(),
          diagnosticoPrincipal: diagnostico.trim() || undefined,
          codigoCie10: cie10.trim().toUpperCase() || undefined,
        },
      });
      toast({
        title: 'Episodio cerrado',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        status === 422
          ? 'El episodio ya está cerrado o archivado'
          : err?.response?.data?.message ?? 'Error al cerrar episodio';
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='lg' scrollBehavior='inside'>
      <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
      <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
        <ModalHeader pb='0'>
          <Flex align='center' gap='3'>
            <Flex
              w='40px'
              h='40px'
              bg='green.500'
              borderRadius='12px'
              align='center'
              justify='center'
              flexShrink={0}>
              <Icon as={MdCheckCircle} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>
                Cerrar Episodio
              </Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                Alta médica — {episode.codigoHc}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          <form id='episode-close-form' onSubmit={handleSubmit}>
            <Text
              color={sectionColor}
              fontSize='xs'
              fontWeight='800'
              textTransform='uppercase'
              letterSpacing='wider'
              mb='12px'>
              Nota de Cierre
            </Text>
            <FormControl isInvalid={!!notaError} mb='20px'>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Resumen del alta{' '}
                <Text as='span' fontWeight='400' color='secondaryGray.500'>
                  (requerido, mín. 10 chars)
                </Text>
              </FormLabel>
              <Textarea
                ref={notaCierreRef}
                value={notaCierre}
                onChange={(e) => {
                  setNotaCierre(e.target.value);
                  if (notaError) setNotaError('');
                }}
                placeholder='Ej: Alta por mejoría clínica. EVA 2/10. Paciente tolera actividades cotidianas sin dolor significativo...'
                rows={5}
                bg={textareaVariantBg}
                border='1px solid'
                borderColor={notaError ? 'red.400' : textareaBorder}
                borderRadius='16px'
                fontSize='sm'
                fontWeight='500'
                resize='vertical'
                _focus={{
                  borderColor: notaError ? 'red.400' : 'brand.500',
                  boxShadow: `0 0 0 1px var(--chakra-colors-${notaError ? 'red-400' : 'brand-500'})`,
                }}
              />
              {notaError && (
                <FormErrorMessage ms='10px'>{notaError}</FormErrorMessage>
              )}
              <Text mt='4px' ms='10px' fontSize='xs' color='secondaryGray.500'>
                {notaCierre.length}/2000
              </Text>
            </FormControl>

            <Divider mb='20px' />

            <Text
              color={sectionColor}
              fontSize='xs'
              fontWeight='800'
              textTransform='uppercase'
              letterSpacing='wider'
              mb='12px'>
              Diagnóstico Final
            </Text>
            <FormField
              id='diagnostico-cierre'
              label='Diagnóstico principal'
              placeholder='Ej: Lumbalgia mecánica con radiculopatía L4-L5'
              extra='(opcional)'
              mb='16px'
              value={diagnostico}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDiagnostico(e.target.value)
              }
            />
            <FormControl isInvalid={!!cie10Error}>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Código CIE-10{' '}
                <Text as='span' fontWeight='400' color='secondaryGray.500'>
                  (opcional)
                </Text>
              </FormLabel>
              <FormField
                id='cie10-cierre'
                label=''
                placeholder='Ej: M51.1'
                mb='0'
                value={cie10}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCie10(e.target.value);
                  if (cie10Error) setCie10Error('');
                }}
                style={{ textTransform: 'uppercase' }}
              />
              {cie10Error && (
                <FormErrorMessage ms='10px'>{cie10Error}</FormErrorMessage>
              )}
            </FormControl>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type='submit'
            form='episode-close-form'
            isLoading={isSubmitting}
            colorScheme='green'
            leftIcon={<Icon as={MdCheckCircle} />}>
            Dar de Alta
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

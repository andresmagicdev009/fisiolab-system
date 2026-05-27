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
import { useUpdateEpisode } from 'hooks/useEpisodes';
import React, { useEffect, useState } from 'react';
import { MdEdit } from 'react-icons/md';
import { ClinicalEpisode } from 'types/models';

interface EpisodeUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: ClinicalEpisode;
}

const CIE10_REGEX = /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/;

export default function EpisodeUpdateModal({
  isOpen,
  onClose,
  episode,
}: EpisodeUpdateModalProps) {
  const toast = useToast();
  const updateEpisode = useUpdateEpisode();

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const sectionColor = useColorModeValue('brand.500', 'brand.400');
  const textareaVariantBg = useColorModeValue('gray.50', 'navy.700');
  const textareaBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  const [diagnostico, setDiagnostico] = useState('');
  const [cie10, setCie10] = useState('');
  const [diagnosticoSec, setDiagnosticoSec] = useState('');
  const [notaApertura, setNotaApertura] = useState('');
  const [cie10Error, setCie10Error] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDiagnostico(episode.diagnosticoPrincipal ?? '');
      setCie10(episode.codigoCie10 ?? '');
      setDiagnosticoSec(episode.diagnosticoSecundario ?? '');
      setNotaApertura(episode.notaApertura ?? '');
      setCie10Error('');
    }
  }, [isOpen, episode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cie10.trim() && !CIE10_REGEX.test(cie10.trim().toUpperCase())) {
      setCie10Error('Formato inválido. Ej: M51.1 o A00');
      return;
    }
    setCie10Error('');

    setIsSubmitting(true);
    try {
      await updateEpisode.mutateAsync({
        patientId: episode.pacienteId,
        episodeId: episode.id,
        payload: {
          diagnosticoPrincipal: diagnostico.trim() || undefined,
          codigoCie10: cie10.trim().toUpperCase() || undefined,
          diagnosticoSecundario: diagnosticoSec.trim() || undefined,
          notaApertura: notaApertura.trim() || undefined,
        },
      });
      toast({
        title: 'Episodio actualizado',
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
          ? 'No se puede editar un episodio cerrado o archivado'
          : err?.response?.data?.message ?? 'Error al actualizar';
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
              bg='brand.500'
              borderRadius='12px'
              align='center'
              justify='center'
              flexShrink={0}>
              <Icon as={MdEdit} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>
                Actualizar Episodio
              </Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {episode.codigoHc}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          <form id='episode-update-form' onSubmit={handleSubmit}>
            <Text
              color={sectionColor}
              fontSize='xs'
              fontWeight='800'
              textTransform='uppercase'
              letterSpacing='wider'
              mb='12px'>
              Diagnóstico
            </Text>
            <FormField
              id='diag-principal'
              label='Diagnóstico principal'
              placeholder='Ej: Lumbalgia mecánica con radiculopatía L4-L5'
              mb='16px'
              value={diagnostico}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDiagnostico(e.target.value)
              }
            />
            <FormControl isInvalid={!!cie10Error} mb='16px'>
              <FormField
                id='cie10'
                label='Código CIE-10'
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
            <FormField
              id='diag-secundario'
              label='Diagnóstico secundario'
              placeholder='Opcional'
              mb='0'
              value={diagnosticoSec}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDiagnosticoSec(e.target.value)
              }
            />

            <Divider my='20px' />

            <Text
              color={sectionColor}
              fontSize='xs'
              fontWeight='800'
              textTransform='uppercase'
              letterSpacing='wider'
              mb='12px'>
              Nota de Apertura
            </Text>
            <FormControl>
              <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                Nota inicial
              </FormLabel>
              <Textarea
                value={notaApertura}
                onChange={(e) => setNotaApertura(e.target.value)}
                placeholder='Actualizar nota de apertura...'
                rows={4}
                bg={textareaVariantBg}
                border='1px solid'
                borderColor={textareaBorder}
                borderRadius='16px'
                fontSize='sm'
                fontWeight='500'
                resize='vertical'
                maxLength={2000}
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
              />
              <Text mt='4px' ms='10px' fontSize='xs' color='secondaryGray.500'>
                {notaApertura.length}/2000
              </Text>
            </FormControl>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type='submit'
            form='episode-update-form'
            isLoading={isSubmitting}
            leftIcon={<Icon as={MdEdit} />}>
            Guardar cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import {
  Badge,
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import FormField from 'components/ui/FormField';
import { useUpdateEpisode } from 'hooks/useEpisodes';
import React, { useEffect, useState } from 'react';
import { MdAutoAwesome, MdLocalHospital } from 'react-icons/md';
import { ClinicalEpisode } from 'types/models';

const CIE10_REGEX = /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/;

interface EpisodeDiagnosticoModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: ClinicalEpisode;
}

export default function EpisodeDiagnosticoModal({
  isOpen,
  onClose,
  episode,
}: EpisodeDiagnosticoModalProps) {
  const toast = useToast();
  const updateEpisode = useUpdateEpisode();

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const sectionColor = useColorModeValue('brand.500', 'brand.400');
  const contextBg = useColorModeValue('gray.50', 'navy.700');
  const contextBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  const [diagnostico, setDiagnostico] = useState('');
  const [cie10, setCie10] = useState('');
  const [diagnosticoSec, setDiagnosticoSec] = useState('');
  const [cie10Error, setCie10Error] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDiagnostico(episode.diagnosticoPrincipal ?? '');
      setCie10(episode.codigoCie10 ?? '');
      setDiagnosticoSec(episode.diagnosticoSecundario ?? '');
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
        },
      });
      toast({
        title: 'Diagnóstico guardado',
        status: 'success',
        duration: 2500,
        isClosable: true,
        position: 'top-right',
      });
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        status === 422
          ? 'No se puede editar un episodio cerrado o archivado'
          : err?.response?.data?.message ?? 'Error al guardar diagnóstico';
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
          <Flex align='center' justify='space-between'>
            <Flex align='center' gap='3'>
              <Flex
                w='40px'
                h='40px'
                bg='teal.500'
                borderRadius='12px'
                align='center'
                justify='center'
                flexShrink={0}>
                <Icon as={MdLocalHospital} color='white' w='20px' h='20px' />
              </Flex>
              <Flex direction='column'>
                <Text color={textColor} fontSize='lg' fontWeight='800'>
                  Diagnóstico
                </Text>
                <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                  {episode.codigoHc}
                </Text>
              </Flex>
            </Flex>
            {/* Botón IA — reservado para integración futura con Claude API */}
            <Tooltip
              label='Próximamente: sugerencia de diagnóstico con IA'
              placement='left'
              hasArrow>
              <Flex
                align='center'
                gap='6px'
                px='10px'
                py='6px'
                borderRadius='10px'
                border='1px dashed'
                borderColor='purple.300'
                cursor='not-allowed'
                opacity={0.5}
                userSelect='none'>
                <Icon as={MdAutoAwesome} color='purple.400' w='14px' h='14px' />
                <Text fontSize='xs' fontWeight='700' color='purple.500'>
                  Sugerir con IA
                </Text>
                <Badge colorScheme='purple' fontSize='9px' borderRadius='full' px='5px'>
                  pronto
                </Badge>
              </Flex>
            </Tooltip>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          {/* Contexto del episodio */}
          <Box
            bg={contextBg}
            border='1px solid'
            borderColor={contextBorder}
            borderRadius='12px'
            px='14px'
            py='10px'
            mb='20px'>
            <Text
              fontSize='9px'
              fontWeight='700'
              color={mutedColor}
              textTransform='uppercase'
              letterSpacing='0.08em'
              mb='4px'>
              Motivo de consulta
            </Text>
            <Text fontSize='sm' color={textColor} fontWeight='500' noOfLines={3}>
              {episode.motivoConsulta}
            </Text>
          </Box>

          <form id='episode-diagnostico-form' onSubmit={handleSubmit}>
            <Text
              color={sectionColor}
              fontSize='xs'
              fontWeight='800'
              textTransform='uppercase'
              letterSpacing='wider'
              mb='12px'>
              Diagnóstico fisioterapéutico
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
              placeholder='Opcional — comorbilidades o hallazgos adicionales'
              mb='0'
              value={diagnosticoSec}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDiagnosticoSec(e.target.value)
              }
            />
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type='submit'
            form='episode-diagnostico-form'
            isLoading={isSubmitting}
            colorScheme='teal'
            leftIcon={<Icon as={MdLocalHospital} />}>
            Guardar diagnóstico
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

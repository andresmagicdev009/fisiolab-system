import {
  Badge,
  Box,
  Divider,
  Flex,
  Icon,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import { useUpdateEpisode } from 'hooks/useEpisodes';
import EpisodeCloseModal from 'components/layouts/patients/EpisodeCloseModal';
import EpisodeDiagnosticoModal from 'components/layouts/patients/EpisodeDiagnosticoModal';
import EpisodeUpdateModal from 'components/layouts/patients/EpisodeUpdateModal';
import TreatmentPlanFormModal from 'components/layouts/patients/TreatmentPlanFormModal';
import React, { useState } from 'react';
import {
  MdCheckCircle,
  MdEdit,
  MdLocalHospital,
  MdPlayArrow,
} from 'react-icons/md';
import { ClinicalEpisode, EstadoEpisodio, UpdateEpisodioDto } from 'types/models';

const ESTADO_META: Record<
  EstadoEpisodio,
  { label: string; colorScheme: string; dot: string }
> = {
  [EstadoEpisodio.ABIERTO]: { label: 'Abierto', colorScheme: 'blue', dot: '#63B3ED' },
  [EstadoEpisodio.EN_TRATAMIENTO]: { label: 'En Tratamiento', colorScheme: 'orange', dot: '#F6AD55' },
  [EstadoEpisodio.CERRADO]: { label: 'Cerrado', colorScheme: 'green', dot: '#68D391' },
  [EstadoEpisodio.ARCHIVADO]: { label: 'Archivado', colorScheme: 'gray', dot: '#A0AEC0' },
};

function formatFecha(d: string): string {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function DataRow({
  label,
  value,
  mono,
  clamp,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  clamp?: number;
}) {
  const labelColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  if (!value) return null;
  return (
    <Flex direction='column' gap='1px' mb='10px' minW='0'>
      <Text
        fontSize='9px'
        fontWeight='700'
        color={labelColor}
        textTransform='uppercase'
        letterSpacing='0.08em'>
        {label}
      </Text>
      <Text
        fontSize='sm'
        fontWeight='600'
        color={textColor}
        fontFamily={mono ? 'mono' : undefined}
        noOfLines={clamp}
        wordBreak='break-word'>
        {value}
      </Text>
    </Flex>
  );
}

interface EpisodeActiveCardProps {
  episode: ClinicalEpisode;
  canWrite: boolean;
  isAdmin: boolean;
  /** Hide the header row (badge/codigoHc/fecha) — used inside timeline */
  headerless?: boolean;
  /** Remove outer border and borderRadius — used inside timeline wrapper */
  noBorder?: boolean;
}

export default function EpisodeActiveCard({
  episode,
  canWrite,
  isAdmin,
  headerless = false,
  noBorder = false,
}: EpisodeActiveCardProps) {
  const toast = useToast();
  const updateEpisode = useUpdateEpisode();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { isOpen: isUpdateOpen, onOpen: onUpdateOpen, onClose: onUpdateClose } = useDisclosure();
  const { isOpen: isCloseOpen, onOpen: onCloseOpen, onClose: onCloseClose } = useDisclosure();
  const { isOpen: isDiagOpen, onOpen: onDiagOpen, onClose: onDiagClose } = useDisclosure();
  const { isOpen: isPlanOpen, onOpen: onPlanOpen, onClose: onPlanClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const noteColor = useColorModeValue('secondaryGray.700', 'secondaryGray.300');
  const diagEmptyColor = useColorModeValue('secondaryGray.400', 'secondaryGray.500');
  const diagEmptyHoverBg = useColorModeValue('gray.50', 'navy.700');

  const cfg = ESTADO_META[episode.estado];
  const isActive =
    episode.estado === EstadoEpisodio.ABIERTO ||
    episode.estado === EstadoEpisodio.EN_TRATAMIENTO;
  const canStartTreatment = canWrite && episode.estado === EstadoEpisodio.ABIERTO;
  const canClose = canWrite && isActive;
  const canEdit = canWrite && isActive;
  const canArchive = isAdmin && episode.estado === EstadoEpisodio.CERRADO;
  const canDiagnose = canWrite && isActive;
  const hasActions =
    canDiagnose || canEdit || canStartTreatment || canClose || canArchive;

  const transition = async (payload: UpdateEpisodioDto, successMsg: string): Promise<boolean> => {
    setIsTransitioning(true);
    try {
      await updateEpisode.mutateAsync({
        patientId: episode.pacienteId,
        episodeId: episode.id,
        payload,
      });
      toast({
        title: successMsg,
        status: 'success',
        duration: 2500,
        isClosable: true,
        position: 'top-right',
      });
      return true;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message ?? 'Intente nuevamente',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
      return false;
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <>
      <Box
        bg={cardBg}
        border={noBorder ? 'none' : '1px solid'}
        borderColor={borderColor}
        borderLeft={noBorder ? 'none' : '4px solid'}
        borderLeftColor={cfg.dot}
        borderRadius={noBorder ? 0 : '16px'}
        overflow='hidden'>
        {/* Header (badge + codigoHc + fecha) — hidden when inside timeline */}
        {!headerless && (
          <Flex
            px='16px'
            py='12px'
            align='center'
            justify='space-between'
            flexWrap='wrap'
            gap='8px'
            borderBottom='1px solid'
            borderColor={dividerColor}>
            <Flex align='center' gap='8px'>
              <Box
                w='8px'
                h='8px'
                borderRadius='full'
                bg={cfg.dot}
                flexShrink={0}
              />
              <Badge
                colorScheme={cfg.colorScheme}
                borderRadius='full'
                px='10px'
                py='2px'
                fontSize='xs'
                fontWeight='700'>
                {cfg.label}
              </Badge>
              <Text
                fontFamily='mono'
                fontSize='xs'
                fontWeight='700'
                color='brand.500'>
                {episode.codigoHc}
              </Text>
            </Flex>
            <Flex align='center' gap='5px' color={mutedColor}>
              <Text fontSize='xs' fontWeight='600'>
                {formatFecha(episode.fechaApertura)}
              </Text>
              {episode.fechaCierre && (
                <>
                  <Text fontSize='xs'>→</Text>
                  <Text fontSize='xs' fontWeight='600'>
                    {formatFecha(episode.fechaCierre)}
                  </Text>
                </>
              )}
            </Flex>
          </Flex>
        )}

        {/* Body */}
        <Box px='16px' pt='14px' pb='16px'>
          {/* Motivo — full text in body */}
          <DataRow label='Motivo de consulta' value={episode.motivoConsulta} />

          {/* Diagnóstico block */}
          {episode.diagnosticoPrincipal || episode.codigoCie10 ? (
            <Flex gap='12px' align='flex-start' flexWrap={{ base: 'wrap', md: 'nowrap' }}>
              <Box flex={1} minW='0'>
                <DataRow
                  label='Diagnóstico principal'
                  value={episode.diagnosticoPrincipal}
                  clamp={2}
                />
              </Box>
              {episode.codigoCie10 && (
                <Box flexShrink={0}>
                  <DataRow label='CIE-10' value={episode.codigoCie10} mono />
                </Box>
              )}
            </Flex>
          ) : isActive ? (
            <Flex
              direction='column'
              gap='1px'
              mb='10px'
              minW='0'
              onClick={canDiagnose ? onDiagOpen : undefined}
              cursor={canDiagnose ? 'pointer' : 'default'}
              borderRadius='8px'
              px='6px'
              py='4px'
              mx='-6px'
              _hover={canDiagnose ? { bg: diagEmptyHoverBg } : undefined}
              role={canDiagnose ? 'button' : undefined}>
              <Text
                fontSize='9px'
                fontWeight='700'
                color={mutedColor}
                textTransform='uppercase'
                letterSpacing='0.08em'>
                Diagnóstico
              </Text>
              <Flex align='center' gap='6px'>
                <Icon as={MdEdit} w='12px' h='12px' color={diagEmptyColor} />
                <Text
                  fontSize='sm'
                  fontWeight='500'
                  color={diagEmptyColor}
                  fontStyle='italic'>
                  Sin diagnóstico —{' '}
                  {canDiagnose ? 'click para añadir' : 'sin registrar'}
                </Text>
              </Flex>
            </Flex>
          ) : null}

          <DataRow label='Diagnóstico secundario' value={episode.diagnosticoSecundario} />

          {episode.notaApertura && (
            <>
              <Divider borderColor={dividerColor} mb='10px' />
              <Text
                fontSize='9px'
                fontWeight='700'
                color={mutedColor}
                textTransform='uppercase'
                letterSpacing='0.08em'
                mb='4px'>
                Nota de apertura
              </Text>
              <Text fontSize='xs' color={noteColor} noOfLines={4} lineHeight='1.6'>
                {episode.notaApertura}
              </Text>
            </>
          )}

          {episode.notaCierre && (
            <>
              <Divider borderColor={dividerColor} my='10px' />
              <Text
                fontSize='9px'
                fontWeight='700'
                color={mutedColor}
                textTransform='uppercase'
                letterSpacing='0.08em'
                mb='4px'>
                Nota de cierre
              </Text>
              <Text fontSize='xs' color={noteColor} noOfLines={4} lineHeight='1.6'>
                {episode.notaCierre}
              </Text>
            </>
          )}

          {/* Action bar */}
          {hasActions && (
            <>
              <Divider borderColor={dividerColor} my='12px' />
              <Flex gap='8px' flexWrap='wrap'>
                {canDiagnose && (
                  <Button
                    size='sm'
                    colorScheme='teal'
                    variant='outline'
                    leftIcon={<Icon as={MdLocalHospital} />}
                    onClick={onDiagOpen}>
                    Diagnóstico
                  </Button>
                )}
                {canEdit && (
                  <Button
                    size='sm'
                    variant='outline'
                    leftIcon={<Icon as={MdEdit} />}
                    onClick={onUpdateOpen}>
                    Actualizar
                  </Button>
                )}
                {canStartTreatment && (
                  <Button
                    size='sm'
                    colorScheme='orange'
                    variant='outline'
                    leftIcon={<Icon as={MdPlayArrow} />}
                    isLoading={isTransitioning}
                    onClick={async () => {
                      const ok = await transition(
                        { estado: EstadoEpisodio.EN_TRATAMIENTO },
                        'Episodio en tratamiento',
                      );
                      if (ok) onPlanOpen();
                    }}>
                    Iniciar Tratamiento
                  </Button>
                )}
                {canClose && (
                  <Button
                    size='sm'
                    colorScheme='green'
                    leftIcon={<Icon as={MdCheckCircle} />}
                    onClick={onCloseOpen}>
                    Dar de Alta
                  </Button>
                )}
                {canArchive && (
                  <Button
                    size='sm'
                    colorScheme='gray'
                    variant='outline'
                    isLoading={isTransitioning}
                    onClick={() =>
                      transition(
                        { estado: EstadoEpisodio.ARCHIVADO },
                        'Episodio archivado',
                      )
                    }>
                    Archivar
                  </Button>
                )}
              </Flex>
            </>
          )}
        </Box>
      </Box>

      {canDiagnose && (
        <EpisodeDiagnosticoModal
          isOpen={isDiagOpen}
          onClose={onDiagClose}
          episode={episode}
        />
      )}
      {canEdit && (
        <EpisodeUpdateModal
          isOpen={isUpdateOpen}
          onClose={onUpdateClose}
          episode={episode}
        />
      )}
      {canClose && (
        <EpisodeCloseModal
          isOpen={isCloseOpen}
          onClose={onCloseClose}
          episode={episode}
        />
      )}
      <TreatmentPlanFormModal
        isOpen={isPlanOpen}
        onClose={onPlanClose}
        episode={episode}
      />
    </>
  );
}

import {
  Badge,
  Box,
  Flex,
  Icon,
  Skeleton,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { useUser } from '@clerk/clerk-react';
import Button from 'components/ui/Button';
import { usePlansByEpisode } from 'hooks/usePlans';
import { useSessionsByPlan } from 'hooks/useSessions';
import EpisodeContextBar from 'components/layouts/patients/EpisodeContextBar';
import SessionFormModal from 'components/layouts/patients/SessionFormModal';
import TreatmentPlanCard from 'components/layouts/patients/TreatmentPlanCard';
import TreatmentPlanDetailModal from 'components/layouts/patients/TreatmentPlanDetailModal';
import TreatmentPlanFormModal from 'components/layouts/patients/TreatmentPlanFormModal';
import React, { useState } from 'react';
import {
  MdAdd,
  MdCalendarToday,
  MdEventNote,
  MdFitnessCenter,
  MdFolderOff,
} from 'react-icons/md';
import {
  ClinicalEpisode,
  EstadoEpisodio,
  EstadoPlan,
  EstadoSesion,
  Patient,
  TipoSesion,
  TreatmentPlan,
} from 'types/models';
import { getUserRole } from 'utils/auth';

const TIPO_META: Record<TipoSesion, { label: string; colorScheme: string }> = {
  [TipoSesion.FISIOTERAPIA]: { label: 'Fisioterapia', colorScheme: 'teal' },
  [TipoSesion.EVALUACION_FISICA]: { label: 'Evaluación Física', colorScheme: 'purple' },
  [TipoSesion.INTERCONSULTA]: { label: 'Interconsulta', colorScheme: 'cyan' },
  [TipoSesion.CONSULTA_MEDICA]: { label: 'Consulta Médica', colorScheme: 'pink' },
};

const ESTADO_SESION_META: Record<EstadoSesion, { label: string; colorScheme: string }> = {
  [EstadoSesion.PROGRAMADA]: { label: 'Programada', colorScheme: 'blue' },
  [EstadoSesion.EN_CURSO]: { label: 'En Curso', colorScheme: 'orange' },
  [EstadoSesion.COMPLETADA]: { label: 'Completada', colorScheme: 'green' },
  [EstadoSesion.CANCELADA]: { label: 'Cancelada', colorScheme: 'red' },
};

function formatFecha(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function isEpisodeActive(ep: ClinicalEpisode) {
  return ep.estado === EstadoEpisodio.ABIERTO || ep.estado === EstadoEpisodio.EN_TRATAMIENTO;
}

// ── Sessions section per plan ──────────────────────────────────────────────────

interface SessionsSectionProps {
  plan: TreatmentPlan;
  episode: ClinicalEpisode;
  canWrite: boolean;
}

function SessionsPlanSection({ plan, episode, canWrite }: SessionsSectionProps) {
  const isPlanActive = plan.estado === EstadoPlan.ACTIVO;
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: sessions = [], isLoading } = useSessionsByPlan(
    episode.pacienteId,
    episode.id,
    plan.id,
  );

  const sectionBg = useColorModeValue('gray.50', 'navy.750');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const emptyColor = useColorModeValue('secondaryGray.400', 'secondaryGray.500');
  const rowHoverBg = useColorModeValue('gray.100', 'navy.700');

  return (
    <>
      <Box
        bg={sectionBg}
        border='1px solid'
        borderColor={borderColor}
        borderRadius='12px'
        mt='4px'
        px='14px'
        py='10px'>
        <Flex align='center' justify='space-between' mb='8px'>
          <Flex align='center' gap='6px'>
            <Icon as={MdEventNote} color={mutedColor} w='13px' h='13px' />
            <Text fontSize='xs' fontWeight='700' color={textColor}>Sesiones</Text>
            {sessions.length > 0 && (
              <Flex
                w='17px' h='17px' borderRadius='full' bg='teal.500'
                align='center' justify='center' flexShrink={0}>
                <Text fontSize='9px' fontWeight='800' color='white'>{sessions.length}</Text>
              </Flex>
            )}
          </Flex>
          {canWrite && isPlanActive && (
            <Button size='xs' colorScheme='teal' leftIcon={<Icon as={MdAdd} />} onClick={onOpen}>
              Nueva Sesión
            </Button>
          )}
        </Flex>

        {isLoading ? (
          <Flex direction='column' gap='4px'>
            <Skeleton h='32px' borderRadius='8px' />
            <Skeleton h='32px' borderRadius='8px' />
          </Flex>
        ) : sessions.length === 0 ? (
          <Flex align='center' justify='center' direction='column' gap='4px' py='10px'>
            <Icon as={MdEventNote} color={emptyColor} w='16px' h='16px' />
            <Text fontSize='xs' color={emptyColor} textAlign='center'>
              {isPlanActive
                ? 'Sin sesiones — registra la primera sesión de este plan'
                : 'Sin sesiones registradas en este plan'}
            </Text>
          </Flex>
        ) : (
          <Flex direction='column' gap='3px'>
            {sessions.map((s) => {
              const tipoMeta = TIPO_META[s.tipo];
              const estadoMeta = ESTADO_SESION_META[s.estado];
              return (
                <Flex
                  key={s.id}
                  align='center'
                  gap='8px'
                  px='8px'
                  py='5px'
                  borderRadius='8px'
                  _hover={{ bg: rowHoverBg }}
                  transition='background 0.15s'>
                  <Text
                    fontFamily='mono'
                    fontSize='10px'
                    fontWeight='700'
                    color='teal.500'
                    flexShrink={0}
                    w='22px'>
                    #{s.numeroSesion}
                  </Text>
                  <Badge
                    colorScheme={tipoMeta.colorScheme}
                    variant='subtle'
                    borderRadius='full'
                    px='6px'
                    fontSize='9px'
                    fontWeight='700'
                    flexShrink={0}>
                    {tipoMeta.label}
                  </Badge>
                  <Badge
                    colorScheme={estadoMeta.colorScheme}
                    variant='subtle'
                    borderRadius='full'
                    px='6px'
                    fontSize='9px'
                    fontWeight='700'
                    flexShrink={0}>
                    {estadoMeta.label}
                  </Badge>
                  <Flex align='center' gap='3px' color={mutedColor} flexShrink={0} ml='auto'>
                    <Icon as={MdCalendarToday} w='10px' h='10px' />
                    <Text fontSize='10px'>{formatFecha(s.fechaSesion)}</Text>
                  </Flex>
                </Flex>
              );
            })}
          </Flex>
        )}
      </Box>

      {canWrite && isPlanActive && (
        <SessionFormModal isOpen={isOpen} onClose={onClose} plan={plan} episode={episode} />
      )}
    </>
  );
}

// ── Episode plans panel ────────────────────────────────────────────────────────

interface EpisodePlansPanelProps {
  episode: ClinicalEpisode;
  canWrite: boolean;
}

function EpisodePlansPanel({ episode, canWrite }: EpisodePlansPanelProps) {
  const active = isEpisodeActive(episode);
  const { data: plans = [], isLoading } = usePlansByEpisode(episode.pacienteId, episode.id);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [selected, setSelected] = useState<TreatmentPlan | null>(null);

  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const emptyColor = useColorModeValue('secondaryGray.400', 'secondaryGray.500');

  const activePlans = plans.filter((p: TreatmentPlan) => p.estado === EstadoPlan.ACTIVO);
  const donePlans = plans.filter((p: TreatmentPlan) => p.estado !== EstadoPlan.ACTIVO);

  return (
    <>
      <Box p='20px'>
        {/* Action row */}
        <Flex align='center' justify='space-between' mb='14px'>
          <Text fontSize='xs' fontWeight='800' color={emptyColor} textTransform='uppercase' letterSpacing='wider'>
            {isLoading ? '…' : `${plans.length} plan${plans.length !== 1 ? 'es' : ''}`}
          </Text>
          {canWrite && active && (
            <Button
              size='sm'
              leftIcon={<Icon as={MdAdd} />}
              onClick={onCreateOpen}>
              Nuevo Plan
            </Button>
          )}
        </Flex>

        {isLoading ? (
          <Flex direction='column' gap='8px'>
            <Skeleton h='80px' borderRadius='12px' />
            <Skeleton h='80px' borderRadius='12px' />
          </Flex>
        ) : plans.length === 0 ? (
          <Flex align='center' justify='center' direction='column' gap='8px' py='48px'>
            <Flex w='48px' h='48px' bg='brand.50' borderRadius='16px' align='center' justify='center'>
              <Icon as={MdFitnessCenter} color='brand.400' w='22px' h='22px' />
            </Flex>
            <Text fontSize='sm' fontWeight='700' color={emptyColor}>Sin planes de tratamiento</Text>
            <Text fontSize='xs' color={emptyColor} textAlign='center' maxW='280px'>
              {active
                ? 'Crea el primer plan de tratamiento para este episodio clínico'
                : 'No se registraron planes en este episodio'}
            </Text>
            {canWrite && active && (
              <Button size='sm' mt='4px' leftIcon={<Icon as={MdAdd} />} onClick={onCreateOpen}>
                Crear plan
              </Button>
            )}
          </Flex>
        ) : (
          <Flex direction='column' gap='16px'>
            {activePlans.length > 0 && (
              <Box>
                <Text
                  fontSize='xs' fontWeight='700' color={mutedColor}
                  textTransform='uppercase' letterSpacing='wider' mb='8px'>
                  Activos ({activePlans.length})
                </Text>
                <Flex direction='column' gap='6px'>
                  {activePlans.map((p) => (
                    <Box key={p.id}>
                      <TreatmentPlanCard
                        plan={p}
                        onClick={() => { setSelected(p); onDetailOpen(); }}
                      />
                      <SessionsPlanSection plan={p} episode={episode} canWrite={canWrite} />
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}

            {donePlans.length > 0 && (
              <Box>
                <Text
                  fontSize='xs' fontWeight='700' color={mutedColor}
                  textTransform='uppercase' letterSpacing='wider' mb='8px'>
                  Anteriores ({donePlans.length})
                </Text>
                <Flex direction='column' gap='6px'>
                  {donePlans.map((p) => (
                    <Box key={p.id}>
                      <TreatmentPlanCard
                        plan={p}
                        onClick={() => { setSelected(p); onDetailOpen(); }}
                      />
                      <SessionsPlanSection plan={p} episode={episode} canWrite={false} />
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}
          </Flex>
        )}
      </Box>

      {canWrite && active && (
        <TreatmentPlanFormModal isOpen={isCreateOpen} onClose={onCreateClose} episode={episode} />
      )}
      {selected && (
        <TreatmentPlanDetailModal
          isOpen={isDetailOpen}
          onClose={() => { onDetailClose(); setSelected(null); }}
          plan={selected}
          episode={episode}
          canEdit={canWrite && active}
        />
      )}
    </>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────────

interface TratamientoTabProps {
  patient: Patient;
  episodes: ClinicalEpisode[];
  selectedEpisodeId: string | null;
  onEpisodeChange: (id: string) => void;
}

export default function TratamientoTab({
  patient,
  episodes,
  selectedEpisodeId,
  onEpisodeChange,
}: TratamientoTabProps) {
  const { user } = useUser();
  const role = getUserRole(user) ?? '';
  const canWrite = ['admin', 'medico', 'fisioterapeuta'].includes(role);

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const emptyBg = useColorModeValue('gray.50', 'navy.800');

  const selectedEpisode = episodes.find((e) => e.id === selectedEpisodeId) ?? null;

  if (episodes.length === 0) {
    return (
      <Flex
        direction='column' align='center' justify='center'
        bg={emptyBg} borderRadius='16px' py='48px' gap='12px' m='20px'>
        <Flex w='48px' h='48px' bg='gray.100' borderRadius='16px' align='center' justify='center'>
          <Icon as={MdFolderOff} color='gray.400' w='22px' h='22px' />
        </Flex>
        <Flex direction='column' align='center' gap='4px'>
          <Text fontSize='sm' fontWeight='700' color={textColor}>Sin episodios clínicos</Text>
          <Text fontSize='xs' color={mutedColor} textAlign='center'>
            Crea un episodio clínico desde Historia Clínica para registrar planes de tratamiento
          </Text>
        </Flex>
      </Flex>
    );
  }

  return (
    <Box>
      <EpisodeContextBar
        episodes={episodes}
        selectedId={selectedEpisodeId}
        onSelect={onEpisodeChange}
      />

      {selectedEpisode ? (
        <EpisodePlansPanel episode={selectedEpisode} canWrite={canWrite} />
      ) : (
        <Flex align='center' justify='center' py='48px'>
          <Text fontSize='sm' color={mutedColor}>Selecciona un episodio para ver los planes</Text>
        </Flex>
      )}
    </Box>
  );
}

import {
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
import { useEvaluationsByEpisode } from 'hooks/useEvaluations';
import EpisodeContextBar from 'layouts/patients/EpisodeContextBar';
import EvaluationCard from 'layouts/patients/EvaluationCard';
import EvaluationDetailModal from 'layouts/patients/EvaluationDetailModal';
import EvaluationFormModal from 'layouts/patients/EvaluationFormModal';
import React, { useState } from 'react';
import { MdAdd, MdFolderOff, MdScience } from 'react-icons/md';
import { ClinicalEpisode, EstadoEpisodio, Patient, PhysicalEvaluation } from 'types/models';
import { getUserRole } from 'utils/auth';

function isEpisodeActive(ep: ClinicalEpisode) {
  return ep.estado === EstadoEpisodio.ABIERTO || ep.estado === EstadoEpisodio.EN_TRATAMIENTO;
}

// ── Episode evaluations panel ──────────────────────────────────────────────────

interface EpisodePanelProps {
  episode: ClinicalEpisode;
  canWrite: boolean;
  isAdmin: boolean;
}

function EpisodeEvaluationsPanel({ episode, canWrite, isAdmin }: EpisodePanelProps) {
  const active = isEpisodeActive(episode);
  const { data: evaluations = [], isLoading } = useEvaluationsByEpisode(
    episode.pacienteId,
    episode.id,
  );

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [selected, setSelected] = useState<PhysicalEvaluation | null>(null);

  const emptyColor = useColorModeValue('secondaryGray.400', 'secondaryGray.500');

  return (
    <>
      <Box p='20px'>
        {/* Action row */}
        <Flex align='center' justify='space-between' mb='14px'>
          <Text fontSize='xs' fontWeight='800' color={emptyColor} textTransform='uppercase' letterSpacing='wider'>
            {isLoading ? '…' : `${evaluations.length} evaluación${evaluations.length !== 1 ? 'es' : ''}`}
          </Text>
          {canWrite && active && (
            <Button
              size='sm'
              colorScheme='teal'
              leftIcon={<Icon as={MdAdd} />}
              onClick={onCreateOpen}>
              Nueva Evaluación
            </Button>
          )}
        </Flex>

        {/* Content */}
        {isLoading ? (
          <Flex direction='column' gap='8px'>
            <Skeleton h='70px' borderRadius='12px' />
            <Skeleton h='70px' borderRadius='12px' />
            <Skeleton h='70px' borderRadius='12px' />
          </Flex>
        ) : evaluations.length === 0 ? (
          <Flex align='center' justify='center' direction='column' gap='8px' py='48px'>
            <Flex w='48px' h='48px' bg='teal.50' borderRadius='16px' align='center' justify='center'>
              <Icon as={MdScience} color='teal.400' w='22px' h='22px' />
            </Flex>
            <Text fontSize='sm' fontWeight='700' color={emptyColor}>Sin evaluaciones físicas</Text>
            <Text fontSize='xs' color={emptyColor} textAlign='center' maxW='280px'>
              {active
                ? 'Registra la primera evaluación física para este episodio clínico'
                : 'No se registraron evaluaciones en este episodio'}
            </Text>
            {canWrite && active && (
              <Button
                size='sm'
                colorScheme='teal'
                mt='4px'
                leftIcon={<Icon as={MdAdd} />}
                onClick={onCreateOpen}>
                Agregar evaluación
              </Button>
            )}
          </Flex>
        ) : (
          <Flex direction='column' gap='8px'>
            {evaluations.map((ev) => (
              <EvaluationCard
                key={ev.id}
                evaluation={ev}
                onClick={() => { setSelected(ev); onDetailOpen(); }}
              />
            ))}
          </Flex>
        )}
      </Box>

      {canWrite && active && (
        <EvaluationFormModal isOpen={isCreateOpen} onClose={onCreateClose} episode={episode} />
      )}
      {selected && (
        <EvaluationDetailModal
          isOpen={isDetailOpen}
          onClose={() => { onDetailClose(); setSelected(null); }}
          evaluation={selected}
          episode={episode}
          canEdit={canWrite && active}
        />
      )}
    </>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────────

interface EvaluacionesTabProps {
  patient: Patient;
  episodes: ClinicalEpisode[];
  selectedEpisodeId: string | null;
  onEpisodeChange: (id: string) => void;
}

export default function EvaluacionesTab({
  patient,
  episodes,
  selectedEpisodeId,
  onEpisodeChange,
}: EvaluacionesTabProps) {
  const { user } = useUser();
  const role = getUserRole(user) ?? '';
  const canWrite = ['admin', 'medico', 'fisioterapeuta'].includes(role);
  const isAdmin = role === 'admin';

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
            Crea un episodio clínico desde Historia Clínica para registrar evaluaciones
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
        <EpisodeEvaluationsPanel
          episode={selectedEpisode}
          canWrite={canWrite}
          isAdmin={isAdmin}
        />
      ) : (
        <Flex align='center' justify='center' py='48px'>
          <Text fontSize='sm' color={mutedColor}>Selecciona un episodio para ver las evaluaciones</Text>
        </Flex>
      )}
    </Box>
  );
}

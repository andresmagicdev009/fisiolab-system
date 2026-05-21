import {
  Box,
  Flex,
  Icon,
  Skeleton,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import { useSoapNotesByEpisode } from 'hooks/useSoap';
import SoapNoteCard from 'layouts/patients/SoapNoteCard';
import SoapNoteDetailModal from 'layouts/patients/SoapNoteDetailModal';
import SoapNoteFormModal from 'layouts/patients/SoapNoteFormModal';
import React, { useState } from 'react';
import { MdAdd, MdExpandMore, MdNotes } from 'react-icons/md';
import { ClinicalEpisode, EstadoEpisodio, SoapNote } from 'types/models';

const PREVIEW_COUNT = 3;

interface Props {
  episode: ClinicalEpisode;
  canWrite: boolean;
  isAdmin: boolean;
  /** Remove outer border — used inside timeline wrapper */
  noBorder?: boolean;
}

export default function EpisodeSoapSection({
  episode,
  canWrite,
  isAdmin,
  noBorder = false,
}: Props) {
  const isActive =
    episode.estado === EstadoEpisodio.ABIERTO ||
    episode.estado === EstadoEpisodio.EN_TRATAMIENTO;

  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<SoapNote | null>(null);

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();

  const { data: allNotes = [], isLoading } = useSoapNotesByEpisode(
    episode.pacienteId,
    episode.id,
  );

  // newest session first
  const notes = [...allNotes].sort((a, b) => b.numeroSesion - a.numeroSesion);
  const notesToShow = showAll ? notes : notes.slice(0, PREVIEW_COUNT);
  const hiddenCount = notes.length - PREVIEW_COUNT;

  const sectionBg = useColorModeValue('gray.50', 'navy.750');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const emptyColor = useColorModeValue('secondaryGray.400', 'secondaryGray.500');

  const content = (
    <Box bg={sectionBg} px='14px' py='12px'>
      {/* Header row */}
      <Flex align='center' justify='space-between' mb='10px'>
        <Flex align='center' gap='6px'>
          <Icon as={MdNotes} color={mutedColor} w='14px' h='14px' />
          <Text fontSize='xs' fontWeight='700' color={textColor}>
            Notas SOAP
          </Text>
          {notes.length > 0 && (
            <Flex
              w='18px'
              h='18px'
              borderRadius='full'
              bg='brand.500'
              align='center'
              justify='center'
              flexShrink={0}>
              <Text fontSize='9px' fontWeight='800' color='white'>
                {notes.length}
              </Text>
            </Flex>
          )}
        </Flex>
        {canWrite && isActive && (
          <Button
            size='xs'
            leftIcon={<Icon as={MdAdd} />}
            onClick={onCreateOpen}>
            Nueva Nota SOAP
          </Button>
        )}
      </Flex>

      {/* Notes list */}
      {isLoading ? (
        <Flex direction='column' gap='6px'>
          <Skeleton h='52px' borderRadius='10px' />
          <Skeleton h='52px' borderRadius='10px' />
        </Flex>
      ) : notes.length === 0 ? (
        <Flex
          align='center'
          justify='center'
          direction='column'
          gap='4px'
          py='12px'>
          <Icon as={MdNotes} color={emptyColor} w='18px' h='18px' />
          <Text fontSize='xs' color={emptyColor} textAlign='center'>
            {isActive
              ? 'Sin notas SOAP — registra la primera atención'
              : 'Sin notas SOAP registradas'}
          </Text>
        </Flex>
      ) : (
        <>
          <Flex direction='column' gap='6px'>
            {notesToShow.map((note) => (
              <SoapNoteCard
                key={note.id}
                note={note}
                onClick={() => {
                  setSelected(note);
                  onDetailOpen();
                }}
              />
            ))}
          </Flex>

          {/* Show more / less */}
          {notes.length > PREVIEW_COUNT && (
            <Flex justify='center' mt='8px'>
              <Button
                size='xs'
                variant='ghost'
                color={mutedColor}
                leftIcon={
                  <Icon
                    as={MdExpandMore}
                    transform={showAll ? 'rotate(180deg)' : 'rotate(0deg)'}
                    transition='transform 0.2s'
                  />
                }
                onClick={() => setShowAll((v) => !v)}>
                {showAll
                  ? 'Ver menos'
                  : `Ver todas (${hiddenCount} más)`}
              </Button>
            </Flex>
          )}
        </>
      )}
    </Box>
  );

  if (noBorder) return (
    <>
      {content}
      {canWrite && isActive && (
        <SoapNoteFormModal
          isOpen={isCreateOpen}
          onClose={onCreateClose}
          episode={episode}
        />
      )}
      {selected && (
        <SoapNoteDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            onDetailClose();
            setSelected(null);
          }}
          note={selected}
          episode={episode}
          canEdit={
            canWrite &&
            isActive &&
            selected.profesionalId === episode.profesionalId
          }
        />
      )}
    </>
  );

  return (
    <>
      <Box
        border='1px solid'
        borderColor={borderColor}
        borderRadius='12px'
        overflow='hidden'
        mt='8px'>
        {content}
      </Box>

      {canWrite && isActive && (
        <SoapNoteFormModal
          isOpen={isCreateOpen}
          onClose={onCreateClose}
          episode={episode}
        />
      )}
      {selected && (
        <SoapNoteDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            onDetailClose();
            setSelected(null);
          }}
          note={selected}
          episode={episode}
          canEdit={
            canWrite &&
            isActive &&
            selected.profesionalId === episode.profesionalId
          }
        />
      )}
    </>
  );
}

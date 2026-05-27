import { Badge, Box, Flex, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import { MdCalendarToday, MdChevronRight } from 'react-icons/md';
import { SoapNote } from 'types/models';

function formatFecha(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function evaColor(eva: number | null): string {
  if (eva === null) return 'gray';
  if (eva <= 3) return 'green';
  if (eva <= 6) return 'orange';
  return 'red';
}

interface SoapNoteCardProps {
  note: SoapNote;
  onClick: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
}

export default function SoapNoteCard({ note, onClick }: SoapNoteCardProps) {
  const bg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const hoverBg = useColorModeValue('gray.50', 'navy.700');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');

  const eva = note.subjetivo?.evaDolor ?? null;
  const diagFisio = note.analisis?.diagnosticoFisioterapeutico;

  return (
    <Flex
      bg={bg}
      border='1px solid'
      borderColor={borderColor}
      borderRadius='12px'
      px='14px'
      py='10px'
      align='center'
      gap='12px'
      cursor='pointer'
      _hover={{ bg: hoverBg, borderColor: 'brand.200' }}
      transition='all 0.15s'
      onClick={onClick}
      role='button'>
      {/* Sesión badge */}
      <Flex
        w='36px'
        h='36px'
        borderRadius='10px'
        bg='brand.50'
        align='center'
        justify='center'
        flexShrink={0}
        direction='column'>
        <Text fontSize='9px' fontWeight='700' color='brand.400' lineHeight='1'>
          Ses.
        </Text>
        <Text fontSize='14px' fontWeight='800' color='brand.500' lineHeight='1.2'>
          {note.numeroSesion}
        </Text>
      </Flex>

      {/* Content */}
      <Box flex={1} minW='0'>
        <Flex align='center' gap='8px' mb='2px' flexWrap='wrap'>
          <Flex align='center' gap='4px' color={mutedColor}>
            <Icon as={MdCalendarToday} w='11px' h='11px' />
            <Text fontSize='xs' fontWeight='600'>{formatFecha(note.fechaSesion)}</Text>
          </Flex>
          {eva !== null && (
            <Badge
              colorScheme={evaColor(eva)}
              borderRadius='full'
              px='6px'
              py='0px'
              fontSize='10px'
              fontWeight='700'>
              EVA {eva}
            </Badge>
          )}
        </Flex>
        <Text fontSize='xs' fontWeight='600' color={textColor} noOfLines={1}>
          {note.subjetivo?.motivoSesion}
        </Text>
        {diagFisio && (
          <Text fontSize='xs' color={mutedColor} noOfLines={1} fontStyle='italic'>
            {diagFisio}
          </Text>
        )}
      </Box>

      <Icon as={MdChevronRight} color={mutedColor} w='16px' h='16px' flexShrink={0} />
    </Flex>
  );
}

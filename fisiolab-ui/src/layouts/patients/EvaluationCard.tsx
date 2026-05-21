import { Badge, Box, Flex, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import { MdCalendarToday, MdChevronRight, MdScience } from 'react-icons/md';
import { PhysicalEvaluation } from 'types/models';

function formatFecha(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function evaColor(eva: number): string {
  if (eva <= 3) return 'green';
  if (eva <= 6) return 'orange';
  return 'red';
}

interface Props {
  evaluation: PhysicalEvaluation;
  onClick: () => void;
}

export default function EvaluationCard({ evaluation, onClick }: Props) {
  const bg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const hoverBg = useColorModeValue('teal.50', 'navy.700');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');

  const romCount = evaluation.rangoMovimiento ? Object.keys(evaluation.rangoMovimiento).length : 0;
  const testCount = evaluation.pruebasEspecificas ? Object.keys(evaluation.pruebasEspecificas).length : 0;
  const posCount = evaluation.pruebasEspecificas
    ? Object.values(evaluation.pruebasEspecificas).filter((p) => p.resultado === 'positivo').length
    : 0;

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
      _hover={{ bg: hoverBg, borderColor: 'teal.200' }}
      transition='all 0.15s'
      onClick={onClick}
      role='button'>
      {/* Eval badge */}
      <Flex
        w='36px'
        h='36px'
        borderRadius='10px'
        bg='teal.50'
        align='center'
        justify='center'
        flexShrink={0}
        direction='column'>
        <Icon as={MdScience} color='teal.500' w='16px' h='16px' />
        <Text fontSize='9px' fontWeight='800' color='teal.500' lineHeight='1.2'>
          #{evaluation.numeroEvaluacion}
        </Text>
      </Flex>

      {/* Content */}
      <Box flex={1} minW='0'>
        <Flex align='center' gap='8px' mb='2px' flexWrap='wrap'>
          <Flex align='center' gap='4px' color={mutedColor}>
            <Icon as={MdCalendarToday} w='11px' h='11px' />
            <Text fontSize='xs' fontWeight='600'>{formatFecha(evaluation.fechaEvaluacion)}</Text>
          </Flex>
          {evaluation.escalaDolor != null && (
            <Badge colorScheme={evaColor(evaluation.escalaDolor)} borderRadius='full' px='6px' fontSize='10px' fontWeight='700'>
              EVA {evaluation.escalaDolor}
            </Badge>
          )}
          {romCount > 0 && (
            <Badge colorScheme='blue' variant='subtle' borderRadius='full' px='6px' fontSize='10px'>
              {romCount} ROM
            </Badge>
          )}
          {testCount > 0 && (
            <Badge
              colorScheme={posCount > 0 ? 'orange' : 'gray'}
              variant='subtle'
              borderRadius='full'
              px='6px'
              fontSize='10px'>
              {posCount > 0 ? `${posCount}+ pruebas` : `${testCount} pruebas`}
            </Badge>
          )}
        </Flex>
        {evaluation.diagnostico ? (
          <Text fontSize='xs' fontWeight='600' color={textColor} noOfLines={1}>
            {evaluation.diagnostico}
          </Text>
        ) : (
          <Text fontSize='xs' color={mutedColor} fontStyle='italic' noOfLines={1}>
            Sin diagnóstico registrado
          </Text>
        )}
      </Box>

      <Icon as={MdChevronRight} color={mutedColor} w='16px' h='16px' flexShrink={0} />
    </Flex>
  );
}

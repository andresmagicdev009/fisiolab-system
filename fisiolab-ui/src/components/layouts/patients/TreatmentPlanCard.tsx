import {
  Badge,
  Box,
  Flex,
  Icon,
  Progress,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import {
  MdCalendarToday,
  MdCheckCircle,
  MdChevronRight,
  MdFitnessCenter,
  MdRepeat,
} from 'react-icons/md';
import { EstadoPlan, TreatmentPlan } from 'types/models';

const ESTADO_CONFIG: Record<EstadoPlan, { colorScheme: string; label: string }> = {
  [EstadoPlan.ACTIVO]: { colorScheme: 'brand', label: 'Activo' },
  [EstadoPlan.COMPLETADO]: { colorScheme: 'green', label: 'Completado' },
  [EstadoPlan.CANCELADO]: { colorScheme: 'gray', label: 'Cancelado' },
};

function formatFecha(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

interface Props {
  plan: TreatmentPlan;
  onClick: () => void;
}

export default function TreatmentPlanCard({ plan, onClick }: Props) {
  const bg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const hoverBg = useColorModeValue('brand.50', 'navy.700');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const progressTrack = useColorModeValue('gray.100', 'navy.600');

  const cfg = ESTADO_CONFIG[plan.estado];
  const exCount = plan.exercises?.length ?? 0;

  return (
    <Flex
      bg={bg}
      border='1px solid'
      borderColor={borderColor}
      borderRadius='14px'
      overflow='hidden'
      cursor='pointer'
      _hover={{ bg: hoverBg, borderColor: 'brand.200' }}
      transition='all 0.15s'
      onClick={onClick}
      role='button'
      direction='column'>
      {/* Progress bar top strip */}
      <Progress
        value={plan.progresoPorcentaje}
        size='xs'
        colorScheme='brand'
        bg={progressTrack}
        borderRadius='0'
      />

      <Flex px='14px' py='12px' align='center' gap='12px'>
        {/* Plan number badge */}
        <Flex
          w='38px'
          h='38px'
          borderRadius='10px'
          bg='brand.50'
          align='center'
          justify='center'
          flexShrink={0}
          direction='column'
          gap='0'>
          <Icon as={MdFitnessCenter} color='brand.500' w='14px' h='14px' />
          <Text fontSize='9px' fontWeight='800' color='brand.500' lineHeight='1.2'>
            #{plan.numeroPlan}
          </Text>
        </Flex>

        {/* Content */}
        <Box flex={1} minW='0'>
          <Flex align='center' gap='6px' mb='3px' flexWrap='wrap'>
            <Badge
              colorScheme={cfg.colorScheme}
              borderRadius='full'
              px='7px'
              py='1px'
              fontSize='10px'
              fontWeight='700'
              flexShrink={0}>
              {cfg.label}
            </Badge>
            <Text
              fontSize='xs'
              fontWeight='700'
              color='brand.500'
              flexShrink={0}>
              {plan.progresoPorcentaje}%
            </Text>
            {exCount > 0 && (
              <Badge
                colorScheme='purple'
                variant='subtle'
                borderRadius='full'
                px='6px'
                fontSize='10px'
                flexShrink={0}>
                {exCount} ejerc.
              </Badge>
            )}
            {plan.frecuenciaSemanal && (
              <Flex align='center' gap='3px' color={mutedColor} flexShrink={0}>
                <Icon as={MdRepeat} w='11px' h='11px' />
                <Text fontSize='xs'>{plan.frecuenciaSemanal}×/sem</Text>
              </Flex>
            )}
            {(plan.fechaInicio || plan.fechaFin) && (
              <Flex align='center' gap='3px' color={mutedColor} flexShrink={0}>
                <Icon as={MdCalendarToday} w='11px' h='11px' />
                <Text fontSize='xs'>
                  {plan.fechaInicio ? formatFecha(plan.fechaInicio) : '?'}
                  {plan.fechaFin ? ` → ${formatFecha(plan.fechaFin)}` : ''}
                </Text>
              </Flex>
            )}
            {plan.duracionEstimadaSemanas && (
              <Flex align='center' gap='3px' color={mutedColor} flexShrink={0}>
                <Icon as={MdCheckCircle} w='11px' h='11px' />
                <Text fontSize='xs'>{plan.duracionEstimadaSemanas} sem</Text>
              </Flex>
            )}
          </Flex>
          <Text fontSize='xs' fontWeight='600' color={textColor} noOfLines={2}>
            {plan.objetivoTerapeutico}
          </Text>
        </Box>

        <Icon as={MdChevronRight} color={mutedColor} w='16px' h='16px' flexShrink={0} />
      </Flex>
    </Flex>
  );
}

import {
  Badge,
  Box,
  Flex,
  Icon,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import {
  MdCalendarToday,
  MdCheckCircle,
  MdClose,
  MdEventRepeat,
  MdPersonOff,
  MdSchedule,
  MdTimer,
} from 'react-icons/md';
import { Appointment, EstadoCita, TipoCita } from 'types/models';

const ESTADO_CONFIG: Record<EstadoCita, { colorScheme: string; label: string; icon: React.ElementType }> = {
  [EstadoCita.CONFIRMADA]: { colorScheme: 'blue', label: 'Confirmada', icon: MdCalendarToday },
  [EstadoCita.CANCELADA]: { colorScheme: 'red', label: 'Cancelada', icon: MdClose },
  [EstadoCita.COMPLETADA]: { colorScheme: 'green', label: 'Completada', icon: MdCheckCircle },
  [EstadoCita.REPROGRAMADA]: { colorScheme: 'purple', label: 'Reprogramada', icon: MdEventRepeat },
  [EstadoCita.NO_ASISTIO]: { colorScheme: 'gray', label: 'No asistió', icon: MdPersonOff },
};

const TIPO_CONFIG: Record<TipoCita, { colorScheme: string; label: string }> = {
  [TipoCita.PRIMERA_VEZ]: { colorScheme: 'purple', label: 'Primera vez' },
  [TipoCita.SEGUIMIENTO]: { colorScheme: 'teal', label: 'Seguimiento' },
  [TipoCita.INTERCONSULTA]: { colorScheme: 'orange', label: 'Interconsulta' },
};

function formatDatetime(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return { date: `${day}/${month}/${year}`, time: `${h}:${m}` };
}

interface Props {
  appointment: Appointment;
  onClick: () => void;
  showPatient?: boolean;
}

export default function AppointmentCard({ appointment, onClick, showPatient = false }: Props) {
  const bg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const hoverBg = useColorModeValue('blue.50', 'navy.700');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');

  const estadoCfg = ESTADO_CONFIG[appointment.estado];
  const tipoCfg = TIPO_CONFIG[appointment.tipoCita];
  const { date, time } = formatDatetime(appointment.scheduledAt);

  return (
    <Flex
      bg={bg}
      border='1px solid'
      borderColor={borderColor}
      borderRadius='14px'
      overflow='hidden'
      cursor='pointer'
      _hover={{ bg: hoverBg, borderColor: 'blue.200' }}
      transition='all 0.15s'
      onClick={onClick}
      role='button'>
      {/* Color strip left */}
      <Box
        w='4px'
        flexShrink={0}
        bg={`${estadoCfg.colorScheme}.400`}
      />

      <Flex px='14px' py='12px' flex={1} align='center' gap='12px' flexWrap='wrap'>
        {/* Date/time block */}
        <Flex
          direction='column'
          align='center'
          justify='center'
          w='52px'
          flexShrink={0}
          gap='1px'>
          <Text fontSize='lg' fontWeight='800' color={textColor} lineHeight='1.1'>
            {date.split('/')[0]}
          </Text>
          <Text fontSize='xs' fontWeight='600' color={mutedColor} textTransform='uppercase'>
            {new Date(appointment.scheduledAt).toLocaleString('es', { month: 'short' })}
          </Text>
          <Flex align='center' gap='2px' color={mutedColor}>
            <Icon as={MdSchedule} w='10px' h='10px' />
            <Text fontSize='10px' fontWeight='600'>{time}</Text>
          </Flex>
        </Flex>

        {/* Main content */}
        <Box flex={1} minW='0'>
          <Flex align='center' gap='6px' mb='3px' flexWrap='wrap'>
            <Badge
              colorScheme={estadoCfg.colorScheme}
              borderRadius='full'
              px='7px'
              py='1px'
              fontSize='10px'
              fontWeight='700'
              flexShrink={0}>
              <Icon as={estadoCfg.icon} w='9px' h='9px' mr='3px' />
              {estadoCfg.label}
            </Badge>
            <Badge
              colorScheme={tipoCfg.colorScheme}
              variant='subtle'
              borderRadius='full'
              px='7px'
              fontSize='10px'
              fontWeight='700'
              flexShrink={0}>
              {tipoCfg.label}
            </Badge>
            <Flex align='center' gap='3px' color={mutedColor} flexShrink={0}>
              <Icon as={MdTimer} w='11px' h='11px' />
              <Text fontSize='xs'>{appointment.durationMinutes} min</Text>
            </Flex>
          </Flex>

          {showPatient && (
            <Text fontSize='sm' fontWeight='700' color={textColor} noOfLines={1}>
              {appointment.patient.nombres} {appointment.patient.apellidos}
            </Text>
          )}

          {appointment.motivo ? (
            <Text fontSize='xs' fontWeight='500' color={textColor} noOfLines={1}>
              {appointment.motivo}
            </Text>
          ) : (
            <Text fontSize='xs' color={mutedColor} fontStyle='italic'>Sin motivo registrado</Text>
          )}

          {appointment.motivoCancelacion && (
            <Text fontSize='xs' color='red.500' noOfLines={1} mt='2px'>
              Cancelación: {appointment.motivoCancelacion}
            </Text>
          )}
          {appointment.motivoReprogramacion && (
            <Text fontSize='xs' color='purple.500' noOfLines={1} mt='2px'>
              Reprogramada: {appointment.motivoReprogramacion}
            </Text>
          )}
        </Box>
      </Flex>
    </Flex>
  );
}

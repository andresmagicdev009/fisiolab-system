import {
  Badge,
  Box,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Skeleton,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { useUser } from '@clerk/clerk-react';
import Card from 'components/card/Card';
import Button from 'components/ui/Button';
import { useAppointments } from 'hooks/useAppointments';
import { useCurrentDbUser } from 'hooks/useCurrentUser';
import AppointmentCancelModal from 'layouts/patients/AppointmentCancelModal';
import AppointmentCompleteModal from 'layouts/patients/AppointmentCompleteModal';
import AppointmentFormModal from 'layouts/patients/AppointmentFormModal';
import React, { useState } from 'react';
import {
  MdAdd,
  MdCalendarToday,
  MdCheckCircle,
  MdClose,
  MdEdit,
  MdFolderOff,
  MdSchedule,
  MdSearch,
  MdTimer,
} from 'react-icons/md';
import { Appointment, EstadoCita, TipoCita } from 'types/models';
import { getUserRole } from 'utils/auth';

const ESTADO_CONFIG: Record<EstadoCita, { colorScheme: string; label: string }> = {
  [EstadoCita.CONFIRMADA]: { colorScheme: 'blue', label: 'Confirmada' },
  [EstadoCita.CANCELADA]: { colorScheme: 'red', label: 'Cancelada' },
  [EstadoCita.COMPLETADA]: { colorScheme: 'green', label: 'Completada' },
  [EstadoCita.REPROGRAMADA]: { colorScheme: 'purple', label: 'Reprogramada' },
  [EstadoCita.NO_ASISTIO]: { colorScheme: 'gray', label: 'No asistió' },
};

const TIPO_CONFIG: Record<TipoCita, { colorScheme: string; label: string }> = {
  [TipoCita.PRIMERA_VEZ]: { colorScheme: 'purple', label: 'Primera vez' },
  [TipoCita.SEGUIMIENTO]: { colorScheme: 'teal', label: 'Seguimiento' },
  [TipoCita.INTERCONSULTA]: { colorScheme: 'orange', label: 'Interconsulta' },
};

function formatDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface AppointmentRowProps {
  appointment: Appointment;
  canWrite: boolean;
  isAdmin: boolean;
  currentUserId: string | undefined;
  onEdit: (a: Appointment) => void;
  onCancel: (a: Appointment) => void;
  onComplete: (a: Appointment) => void;
}

function AppointmentRow({ appointment, canWrite, isAdmin, currentUserId, onEdit, onCancel, onComplete }: AppointmentRowProps) {
  const bg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');

  const estadoCfg = ESTADO_CONFIG[appointment.estado];
  const tipoCfg = TIPO_CONFIG[appointment.tipoCita];
  const isConfirmada = appointment.estado === EstadoCita.CONFIRMADA;
  const canComplete = isConfirmada && (isAdmin || appointment.professionalId === currentUserId);

  return (
    <Flex
      bg={bg}
      border='1px solid'
      borderColor={borderColor}
      borderRadius='12px'
      px='16px'
      py='12px'
      align='center'
      gap='12px'
      flexWrap='wrap'>
      {/* Left strip */}
      <Box w='3px' h='40px' borderRadius='full' bg={`${estadoCfg.colorScheme}.400`} flexShrink={0} />

      {/* Date/time */}
      <Flex direction='column' w='120px' flexShrink={0}>
        <Flex align='center' gap='4px' color={textColor}>
          <Icon as={MdSchedule} w='12px' h='12px' />
          <Text fontSize='sm' fontWeight='700'>{formatDatetime(appointment.scheduledAt)}</Text>
        </Flex>
        <Flex align='center' gap='4px' color={mutedColor}>
          <Icon as={MdTimer} w='10px' h='10px' />
          <Text fontSize='xs'>{appointment.durationMinutes} min</Text>
        </Flex>
      </Flex>

      {/* Patient */}
      <Box flex={1} minW='140px'>
        <Text fontSize='sm' fontWeight='700' color={textColor} noOfLines={1}>
          {appointment.patient.nombres} {appointment.patient.apellidos}
        </Text>
        <Text fontSize='xs' fontFamily='mono' color={mutedColor}>{appointment.patient.cedula}</Text>
      </Box>

      {/* Badges */}
      <Flex gap='6px' flexWrap='wrap' flexShrink={0}>
        <Badge colorScheme={estadoCfg.colorScheme} borderRadius='full' px='7px' fontSize='10px' fontWeight='700'>
          {estadoCfg.label}
        </Badge>
        <Badge colorScheme={tipoCfg.colorScheme} variant='subtle' borderRadius='full' px='7px' fontSize='10px' fontWeight='700'>
          {tipoCfg.label}
        </Badge>
      </Flex>

      {/* Motivo */}
      {appointment.motivo && (
        <Text fontSize='xs' color={mutedColor} noOfLines={1} flex={1} minW='100px'>
          {appointment.motivo}
        </Text>
      )}

      {/* Actions */}
      <Flex gap='6px' flexShrink={0}>
        {isConfirmada && canWrite && (
          <Button size='xs' variant='outline' leftIcon={<Icon as={MdEdit} />} onClick={() => onEdit(appointment)}>
            Editar
          </Button>
        )}
        {isConfirmada && canWrite && (
          <Button size='xs' colorScheme='red' variant='outline' leftIcon={<Icon as={MdClose} />} onClick={() => onCancel(appointment)}>
            Cancelar
          </Button>
        )}
        {canComplete && (
          <Button size='xs' colorScheme='green' leftIcon={<Icon as={MdCheckCircle} />} onClick={() => onComplete(appointment)}>
            Completar
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

export default function AppointmentsView() {
  const { user } = useUser();
  const role = getUserRole(user) ?? '';
  const canWrite = ['admin', 'medico', 'fisioterapeuta'].includes(role);
  const isAdmin = role === 'admin';

  const { data: currentDbUser } = useCurrentDbUser();

  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [search, setSearch] = useState('');

  const queryParams = {
    limit: 100,
    ...(estadoFilter ? { estado: estadoFilter } : {}),
    ...(tipoFilter ? { tipoCita: tipoFilter } : {}),
    ...(desde ? { desde } : {}),
    ...(hasta ? { hasta } : {}),
  };

  const { data: result, isLoading } = useAppointments(queryParams);
  const allAppointments = result?.data ?? [];

  // Client-side search by patient name
  const appointments = search.trim()
    ? allAppointments.filter((a) =>
        `${a.patient.nombres} ${a.patient.apellidos} ${a.patient.cedula}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : allAppointments;

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null);

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const emptyIconBg = useColorModeValue('gray.100', 'navy.700');

  return (
    <Box pt='80px' px={{ base: '16px', md: '24px' }} maxW='1400px' mx='auto'>
      {/* Header */}
      <Flex align='center' justify='space-between' mb='24px' flexWrap='wrap' gap='12px'>
        <Flex direction='column'>
          <Text fontSize='2xl' fontWeight='800' color={textColor}>Citas</Text>
          <Text fontSize='sm' color={mutedColor}>
            {result?.meta?.total ?? 0} cita{(result?.meta?.total ?? 0) !== 1 ? 's' : ''} en total
          </Text>
        </Flex>
        {canWrite && (
          <Button leftIcon={<Icon as={MdAdd} />} colorScheme='blue' onClick={onCreateOpen}>
            Agendar Cita
          </Button>
        )}
      </Flex>

      {/* Filters */}
      <Card p='16px' mb='20px'>
        <Flex gap='12px' flexWrap='wrap' align='flex-end'>
          <Box flex={1} minW='180px'>
            <Text fontSize='xs' fontWeight='700' color={mutedColor} mb='6px' textTransform='uppercase'>Buscar paciente</Text>
            <InputGroup size='sm'>
              <InputLeftElement>
                <Icon as={MdSearch} color={mutedColor} w='14px' h='14px' />
              </InputLeftElement>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Nombre o cédula...'
                bg={inputBg} border='1px solid' borderColor={inputBorder}
                borderRadius='10px'
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              />
            </InputGroup>
          </Box>

          <Box minW='140px'>
            <Text fontSize='xs' fontWeight='700' color={mutedColor} mb='6px' textTransform='uppercase'>Estado</Text>
            <Select
              size='sm'
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              bg={inputBg} border='1px solid' borderColor={inputBorder}
              borderRadius='10px'
              _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}>
              <option value=''>Todos</option>
              <option value='CONFIRMADA'>Confirmada</option>
              <option value='COMPLETADA'>Completada</option>
              <option value='CANCELADA'>Cancelada</option>
            </Select>
          </Box>

          <Box minW='140px'>
            <Text fontSize='xs' fontWeight='700' color={mutedColor} mb='6px' textTransform='uppercase'>Tipo</Text>
            <Select
              size='sm'
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              bg={inputBg} border='1px solid' borderColor={inputBorder}
              borderRadius='10px'
              _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}>
              <option value=''>Todos</option>
              <option value='PRIMERA_VEZ'>Primera vez</option>
              <option value='SEGUIMIENTO'>Seguimiento</option>
              <option value='INTERCONSULTA'>Interconsulta</option>
            </Select>
          </Box>

          <Box minW='130px'>
            <Text fontSize='xs' fontWeight='700' color={mutedColor} mb='6px' textTransform='uppercase'>Desde</Text>
            <Input
              type='date' size='sm'
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              bg={inputBg} border='1px solid' borderColor={inputBorder}
              borderRadius='10px'
              _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
            />
          </Box>

          <Box minW='130px'>
            <Text fontSize='xs' fontWeight='700' color={mutedColor} mb='6px' textTransform='uppercase'>Hasta</Text>
            <Input
              type='date' size='sm'
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              bg={inputBg} border='1px solid' borderColor={inputBorder}
              borderRadius='10px'
              _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
            />
          </Box>

          {(estadoFilter || tipoFilter || desde || hasta || search) && (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => { setEstadoFilter(''); setTipoFilter(''); setDesde(''); setHasta(''); setSearch(''); }}>
              Limpiar
            </Button>
          )}
        </Flex>
      </Card>

      {/* List */}
      <Card p='0' overflow='hidden'>
        {isLoading ? (
          <Flex direction='column' gap='8px' p='16px'>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} h='64px' borderRadius='12px' />)}
          </Flex>
        ) : appointments.length === 0 ? (
          <Flex direction='column' align='center' justify='center' py='60px' gap='12px'>
            <Flex w='56px' h='56px' bg={emptyIconBg} borderRadius='16px' align='center' justify='center'>
              <Icon as={MdFolderOff} color={mutedColor} w='24px' h='24px' />
            </Flex>
            <Flex direction='column' align='center' gap='4px'>
              <Text fontSize='sm' fontWeight='700' color={textColor}>Sin citas</Text>
              <Text fontSize='xs' color={mutedColor}>No hay citas con los filtros seleccionados</Text>
            </Flex>
          </Flex>
        ) : (
          <Flex direction='column' gap='6px' p='16px'>
            {appointments.map((a) => (
              <AppointmentRow
                key={a.id}
                appointment={a}
                canWrite={canWrite}
                isAdmin={isAdmin}
                currentUserId={currentDbUser?.id}
                onEdit={setEditTarget}
                onCancel={setCancelTarget}
                onComplete={setCompleteTarget}
              />
            ))}
          </Flex>
        )}
      </Card>

      {/* Modals */}
      <AppointmentFormModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        isAdmin={isAdmin}
      />
      {editTarget && (
        <AppointmentFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          patientId={editTarget.patientId}
          appointment={editTarget}
          isAdmin={isAdmin}
        />
      )}
      {cancelTarget && (
        <AppointmentCancelModal
          isOpen={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          appointment={cancelTarget}
        />
      )}
      {completeTarget && (
        <AppointmentCompleteModal
          isOpen={!!completeTarget}
          onClose={() => setCompleteTarget(null)}
          appointment={completeTarget}
        />
      )}
    </Box>
  );
}

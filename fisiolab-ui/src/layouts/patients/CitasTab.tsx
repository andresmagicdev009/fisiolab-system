import {
  Badge,
  Box,
  Divider,
  Flex,
  Grid,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { useUser } from '@clerk/clerk-react';
import Button from 'components/ui/Button';
import { useAppointmentsByPatient, useNoShowAppointment } from 'hooks/useAppointments';
import { useCurrentDbUser } from 'hooks/useCurrentUser';
import AppointmentCard from 'layouts/patients/AppointmentCard';
import AppointmentCancelModal from 'layouts/patients/AppointmentCancelModal';
import AppointmentCompleteModal from 'layouts/patients/AppointmentCompleteModal';
import AppointmentFormModal from 'layouts/patients/AppointmentFormModal';
import AppointmentRescheduleModal from 'layouts/patients/AppointmentRescheduleModal';
import React, { useState } from 'react';
import {
  MdAdd,
  MdArrowBack,
  MdArrowForward,
  MdCalendarMonth,
  MdCalendarToday,
  MdCheckCircle,
  MdClose,
  MdEdit,
  MdEventRepeat,
  MdFolderOff,
  MdList,
  MdPersonOff,
  MdSchedule,
  MdTimer,
} from 'react-icons/md';
import { EnrichedAppointment, EstadoCita, Patient, TipoCita } from 'types/models';
import { getUserRole } from 'utils/auth';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TipoCita, string> = {
  [TipoCita.PRIMERA_VEZ]: 'Primera vez',
  [TipoCita.SEGUIMIENTO]: 'Seguimiento',
  [TipoCita.INTERCONSULTA]: 'Interconsulta',
};

const ESTADO_DOT: Record<EstadoCita, string> = {
  [EstadoCita.CONFIRMADA]: '#63B3ED',
  [EstadoCita.COMPLETADA]: '#68D391',
  [EstadoCita.CANCELADA]: '#FC8181',
  [EstadoCita.REPROGRAMADA]: '#B794F4',
  [EstadoCita.NO_ASISTIO]: '#CBD5E0',
};

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDatetime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7; // Monday-based offset
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ── AppointmentDetailModal ────────────────────────────────────────────────────

const ESTADO_BADGE_COLOR: Record<EstadoCita, string> = {
  [EstadoCita.CONFIRMADA]: 'blue',
  [EstadoCita.COMPLETADA]: 'green',
  [EstadoCita.CANCELADA]: 'red',
  [EstadoCita.REPROGRAMADA]: 'purple',
  [EstadoCita.NO_ASISTIO]: 'gray',
};

interface DetailProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: EnrichedAppointment;
  canWrite: boolean;
  isAdmin: boolean;
  currentUserId: string | undefined;
}

function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  canWrite,
  isAdmin,
  currentUserId,
}: DetailProps) {
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const { isOpen: isCompleteOpen, onOpen: onCompleteOpen, onClose: onCompleteClose } = useDisclosure();
  const { isOpen: isRescheduleOpen, onOpen: onRescheduleOpen, onClose: onRescheduleClose } = useDisclosure();

  const noShow = useNoShowAppointment();
  const toast = useToast();
  const [noShowLoading, setNoShowLoading] = useState(false);

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const noteColor = useColorModeValue('secondaryGray.700', 'secondaryGray.300');
  const paymentBg = useColorModeValue('green.50', 'green.900');
  const paymentBorder = useColorModeValue('green.100', 'green.800');
  const reprogBg = useColorModeValue('purple.50', 'purple.900');
  const reprogBorder = useColorModeValue('purple.100', 'purple.800');
  const noShowBg = useColorModeValue('gray.50', 'navy.700');

  const isConfirmada = appointment.estado === EstadoCita.CONFIRMADA;
  const canComplete = isConfirmada && (isAdmin || appointment.professionalId === currentUserId);
  const canCancel = isConfirmada && canWrite;
  const canEdit = isConfirmada && canWrite;
  const canReschedule = isConfirmada && canWrite;
  const canNoShow = isConfirmada && canWrite;

  const handleClose = () => {
    onEditClose();
    onCancelClose();
    onCompleteClose();
    onRescheduleClose();
    onClose();
  };

  const handleNoShow = async () => {
    setNoShowLoading(true);
    try {
      await noShow.mutateAsync(appointment.id);
      toast({ title: 'Registrado', description: 'Paciente marcado como no asistió', status: 'info', duration: 3000, isClosable: true, position: 'top-right' });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al registrar';
      toast({ title: 'Error', description: msg, status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
    } finally {
      setNoShowLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size='md' scrollBehavior='inside'>
        <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
        <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
          <ModalHeader pb='0'>
            <Flex align='center' gap='12px'>
              <Flex
                w='40px' h='40px'
                bg={`${ESTADO_BADGE_COLOR[appointment.estado]}.500`}
                borderRadius='12px'
                align='center' justify='center' flexShrink={0}>
                <Icon as={MdCalendarToday} color='white' w='20px' h='20px' />
              </Flex>
              <Flex direction='column'>
                <Text color={textColor} fontSize='lg' fontWeight='800'>Detalle de Cita</Text>
                <Badge
                  colorScheme={ESTADO_BADGE_COLOR[appointment.estado]}
                  borderRadius='full' px='8px' fontSize='xs' fontWeight='700' w='fit-content'>
                  {appointment.estado.replace('_', ' ')}
                </Badge>
              </Flex>
            </Flex>
          </ModalHeader>
          <ModalCloseButton top='20px' />

          <ModalBody pt='16px' pb='6'>
            <Flex direction='column' gap='10px'>
              {/* Fecha */}
              <Flex gap='10px' align='flex-start'>
                <Icon as={MdSchedule} color={mutedColor} w='16px' h='16px' mt='2px' flexShrink={0} />
                <Box>
                  <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em'>
                    Fecha y hora
                  </Text>
                  <Text fontSize='sm' fontWeight='600' color={textColor}>
                    {formatDatetime(appointment.scheduledAt)}
                  </Text>
                </Box>
              </Flex>

              {/* Duración / tipo */}
              <Flex gap='10px' align='flex-start'>
                <Icon as={MdTimer} color={mutedColor} w='16px' h='16px' mt='2px' flexShrink={0} />
                <Box>
                  <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em'>
                    Duración / Tipo
                  </Text>
                  <Text fontSize='sm' fontWeight='600' color={textColor}>
                    {appointment.durationMinutes} min — {TIPO_LABEL[appointment.tipoCita]}
                  </Text>
                </Box>
              </Flex>

              {/* Motivo */}
              {appointment.motivo && (
                <>
                  <Divider borderColor={dividerColor} />
                  <Box>
                    <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em' mb='4px'>
                      Motivo
                    </Text>
                    <Text fontSize='sm' color={noteColor} lineHeight='1.6'>{appointment.motivo}</Text>
                  </Box>
                </>
              )}

              {/* Notas */}
              {appointment.notas && (
                <>
                  <Divider borderColor={dividerColor} />
                  <Box>
                    <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em' mb='4px'>
                      Notas internas
                    </Text>
                    <Text fontSize='sm' color={noteColor} lineHeight='1.6'>{appointment.notas}</Text>
                  </Box>
                </>
              )}

              {/* Motivo cancelación */}
              {appointment.motivoCancelacion && (
                <>
                  <Divider borderColor={dividerColor} />
                  <Box>
                    <Text fontSize='9px' fontWeight='700' color='red.400' textTransform='uppercase' letterSpacing='0.08em' mb='4px'>
                      Motivo cancelación
                    </Text>
                    <Text fontSize='sm' color='red.500' lineHeight='1.6'>{appointment.motivoCancelacion}</Text>
                  </Box>
                </>
              )}

              {/* Motivo reprogramación */}
              {appointment.motivoReprogramacion && (
                <>
                  <Divider borderColor={dividerColor} />
                  <Box>
                    <Text fontSize='9px' fontWeight='700' color='purple.400' textTransform='uppercase' letterSpacing='0.08em' mb='4px'>
                      Motivo reprogramación
                    </Text>
                    <Text fontSize='sm' color='purple.500' lineHeight='1.6'>{appointment.motivoReprogramacion}</Text>
                  </Box>
                </>
              )}

              {/* Cadena reprogramación */}
              {(appointment.reprogramadaDe || appointment.nuevaCita) && (
                <>
                  <Divider borderColor={dividerColor} />
                  <Flex gap='8px' direction='column'>
                    {appointment.reprogramadaDe && (
                      <Flex bg={reprogBg} border='1px solid' borderColor={reprogBorder} borderRadius='10px' px='12px' py='8px' align='center' gap='8px'>
                        <Icon as={MdEventRepeat} color='purple.400' w='13px' h='13px' flexShrink={0} />
                        <Box>
                          <Text fontSize='9px' fontWeight='700' color='purple.400' textTransform='uppercase' letterSpacing='0.08em'>
                            Reprogramada desde
                          </Text>
                          <Text fontSize='xs' fontWeight='600' color='purple.600'>
                            {formatDatetime(appointment.reprogramadaDe.scheduledAt)}
                          </Text>
                        </Box>
                      </Flex>
                    )}
                    {appointment.nuevaCita && (
                      <Flex bg={reprogBg} border='1px solid' borderColor={reprogBorder} borderRadius='10px' px='12px' py='8px' align='center' gap='8px'>
                        <Icon as={MdEventRepeat} color='purple.400' w='13px' h='13px' flexShrink={0} />
                        <Box>
                          <Text fontSize='9px' fontWeight='700' color='purple.400' textTransform='uppercase' letterSpacing='0.08em'>
                            Nueva cita programada
                          </Text>
                          <Text fontSize='xs' fontWeight='600' color='purple.600'>
                            {formatDatetime(appointment.nuevaCita.scheduledAt)} · {appointment.nuevaCita.estado}
                          </Text>
                        </Box>
                      </Flex>
                    )}
                  </Flex>
                </>
              )}

              {/* Episodio enriquecido */}
              {appointment.episode && (
                <>
                  <Divider borderColor={dividerColor} />
                  <Box>
                    <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em' mb='4px'>
                      Episodio clínico
                    </Text>
                    <Text fontFamily='mono' fontSize='xs' fontWeight='700' color='brand.500'>
                      {appointment.episode.codigoHc}
                    </Text>
                    <Text fontSize='xs' color={noteColor} noOfLines={1}>{appointment.episode.motivoConsulta}</Text>
                  </Box>
                </>
              )}

              {/* Pago */}
              {appointment.payment && (
                <Flex bg={paymentBg} border='1px solid' borderColor={paymentBorder} borderRadius='10px' px='12px' py='8px' align='center' gap='8px' mt='4px'>
                  <Icon as={MdCheckCircle} color='green.500' w='14px' h='14px' flexShrink={0} />
                  <Text fontSize='xs' fontWeight='600' color='green.700'>
                    Cobro: ${appointment.payment.monto} — {appointment.payment.estadoPago}
                  </Text>
                </Flex>
              )}

              {/* No asistió banner */}
              {appointment.estado === EstadoCita.NO_ASISTIO && (
                <Flex bg={noShowBg} borderRadius='10px' px='12px' py='8px' align='center' gap='8px' border='1px solid' borderColor={dividerColor}>
                  <Icon as={MdPersonOff} color='gray.400' w='14px' h='14px' flexShrink={0} />
                  <Text fontSize='xs' fontWeight='600' color={mutedColor}>
                    Paciente no asistió — sin cobro generado
                  </Text>
                </Flex>
              )}
            </Flex>
          </ModalBody>

          {(canEdit || canCancel || canComplete || canReschedule || canNoShow) && (
            <ModalFooter gap='2' flexWrap='wrap'>
              {canEdit && (
                <Button size='sm' variant='outline' leftIcon={<Icon as={MdEdit} />} onClick={onEditOpen}>
                  Editar
                </Button>
              )}
              {canReschedule && (
                <Button size='sm' colorScheme='purple' variant='outline' leftIcon={<Icon as={MdEventRepeat} />} onClick={onRescheduleOpen}>
                  Reprogramar
                </Button>
              )}
              {canNoShow && (
                <Button
                  size='sm'
                  colorScheme='gray'
                  variant='outline'
                  leftIcon={<Icon as={MdPersonOff} />}
                  onClick={handleNoShow}
                  isLoading={noShowLoading}
                  loadingText='Registrando...'>
                  No asistió
                </Button>
              )}
              {canCancel && (
                <Button size='sm' colorScheme='red' variant='outline' leftIcon={<Icon as={MdClose} />} onClick={onCancelOpen}>
                  Cancelar
                </Button>
              )}
              {canComplete && (
                <Button size='sm' colorScheme='green' leftIcon={<Icon as={MdCheckCircle} />} onClick={onCompleteOpen}>
                  Completar
                </Button>
              )}
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      <AppointmentFormModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        patientId={appointment.patientId}
        appointment={appointment}
        isAdmin={isAdmin}
      />
      <AppointmentCancelModal isOpen={isCancelOpen} onClose={onCancelClose} appointment={appointment} />
      <AppointmentCompleteModal isOpen={isCompleteOpen} onClose={onCompleteClose} appointment={appointment} />
      <AppointmentRescheduleModal isOpen={isRescheduleOpen} onClose={onRescheduleClose} appointment={appointment} />
    </>
  );
}

// ── MiniCalendar ──────────────────────────────────────────────────────────────

interface MiniCalendarProps {
  year: number;
  month: number;
  appointments: EnrichedAppointment[];
  selectedDay: Date | null;
  onDaySelect: (d: Date | null) => void;
  onMonthChange: (year: number, month: number) => void;
}

function MiniCalendar({
  year,
  month,
  appointments,
  selectedDay,
  onDaySelect,
  onMonthChange,
}: MiniCalendarProps) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.600', 'secondaryGray.400');
  const weekdayColor = useColorModeValue('secondaryGray.700', 'secondaryGray.300');
  const hoverBg = useColorModeValue('gray.50', 'navy.700');
  const selectedBg = 'brand.500';
  const todayOutline = useColorModeValue('brand.400', 'brand.300');

  const today = new Date();
  const cells = getCalendarCells(year, month);

  const byDay = new Map<number, EnrichedAppointment[]>();
  for (const appt of appointments) {
    const d = new Date(appt.scheduledAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(appt);
    }
  }

  function handlePrev() {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  }
  function handleNext() {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  }

  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  return (
    <Box>
      {/* Month navigation */}
      <Flex align='center' justify='space-between' mb='10px'>
        <IconButton
          aria-label='Mes anterior'
          icon={<Icon as={MdArrowBack} w='16px' h='16px' />}
          size='sm'
          variant='ghost'
          colorScheme='brand'
          onClick={handlePrev}
        />
        <Flex align='center' gap='8px'>
          <Text fontSize='md' fontWeight='800' color={textColor}>
            {MONTHS_ES[month]} {year}
          </Text>
          {!isCurrentMonth && (
            <Text
              fontSize='10px'
              fontWeight='700'
              color='brand.500'
              cursor='pointer'
              onClick={() => onMonthChange(today.getFullYear(), today.getMonth())}
              _hover={{ textDecoration: 'underline' }}>
              Hoy
            </Text>
          )}
        </Flex>
        <IconButton
          aria-label='Mes siguiente'
          icon={<Icon as={MdArrowForward} w='16px' h='16px' />}
          size='sm'
          variant='ghost'
          colorScheme='brand'
          onClick={handleNext}
        />
      </Flex>

      {/* Weekday headers */}
      <Grid templateColumns='repeat(7, 1fr)' mb='4px'>
        {WEEKDAYS.map((wd) => (
          <Flex key={wd} align='center' justify='center' py='6px'>
            <Text
              fontSize='12px'
              fontWeight='700'
              color={weekdayColor}
              textTransform='uppercase'
              letterSpacing='0.08em'>
              {wd}
            </Text>
          </Flex>
        ))}
      </Grid>

      {/* Day cells */}
      <Grid templateColumns='repeat(7, 1fr)' gap='4px'>
        {cells.map((day, i) => {
          if (day === null) return <Box key={i} minH='56px' />;

          const date = new Date(year, month, day);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;
          const dayAppts = byDay.get(day) ?? [];

          return (
            <Flex
              key={i}
              direction='column'
              align='center'
              justify='flex-start'
              py='10px'
              px='4px'
              borderRadius='10px'
              cursor='pointer'
              bg={isSelected ? selectedBg : 'transparent'}
              _hover={{ bg: isSelected ? selectedBg : hoverBg }}
              border='2px solid'
              borderColor={isToday && !isSelected ? todayOutline : 'transparent'}
              onClick={() => onDaySelect(isSelected ? null : date)}
              transition='background 0.15s'
              minH='56px'>
              <Text
                fontSize='md'
                fontWeight={isToday || isSelected ? '800' : '600'}
                color={isSelected ? 'white' : isToday ? 'brand.500' : textColor}
                lineHeight='1'>
                {day}
              </Text>

              {dayAppts.length > 0 && (
                <Flex gap='3px' mt='6px' flexWrap='wrap' justify='center' maxW='36px'>
                  {dayAppts.slice(0, 3).map((a, di) => (
                    <Box
                      key={di}
                      w='6px'
                      h='6px'
                      borderRadius='full'
                      bg={isSelected ? 'whiteAlpha.800' : ESTADO_DOT[a.estado]}
                    />
                  ))}
                  {dayAppts.length > 3 && (
                    <Text
                      fontSize='8px'
                      fontWeight='800'
                      color={isSelected ? 'white' : mutedColor}
                      lineHeight='1'>
                      +{dayAppts.length - 3}
                    </Text>
                  )}
                </Flex>
              )}
            </Flex>
          );
        })}
      </Grid>

      {/* Legend */}
      <Flex gap='12px' mt='12px' flexWrap='wrap'>
        {(
          [
            { label: 'Confirmada', color: ESTADO_DOT[EstadoCita.CONFIRMADA] },
            { label: 'Completada', color: ESTADO_DOT[EstadoCita.COMPLETADA] },
            { label: 'Cancelada', color: ESTADO_DOT[EstadoCita.CANCELADA] },
            { label: 'Reprogramada', color: ESTADO_DOT[EstadoCita.REPROGRAMADA] },
            { label: 'No asistió', color: ESTADO_DOT[EstadoCita.NO_ASISTIO] },
          ] as { label: string; color: string }[]
        ).map(({ label, color }) => (
          <Flex key={label} align='center' gap='4px'>
            <Box w='7px' h='7px' borderRadius='full' bg={color} flexShrink={0} />
            <Text fontSize='10px' color={mutedColor} fontWeight='600'>
              {label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

// ── DayPanel ──────────────────────────────────────────────────────────────────

interface DayPanelProps {
  selectedDay: Date | null;
  dayAppointments: EnrichedAppointment[];
  upcomingAppointments: EnrichedAppointment[];
  onAppointmentClick: (a: EnrichedAppointment) => void;
}

function DayPanel({
  selectedDay,
  dayAppointments,
  upcomingAppointments,
  onAppointmentClick,
}: DayPanelProps) {
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const emptyBg = useColorModeValue('gray.50', 'navy.800');

  const list = selectedDay ? dayAppointments : upcomingAppointments;
  const title = selectedDay
    ? selectedDay.toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : 'Próximas citas';

  return (
    <Flex direction='column' gap='8px'>
      <Text
        fontSize='xs'
        fontWeight='800'
        color={mutedColor}
        textTransform='uppercase'
        letterSpacing='wider'>
        {title} {list.length > 0 && `(${list.length})`}
      </Text>

      {list.length === 0 ? (
        <Flex
          direction='column'
          align='center'
          justify='center'
          bg={emptyBg}
          borderRadius='14px'
          py='32px'
          gap='8px'>
          <Icon as={MdCalendarToday} color='gray.300' w='20px' h='20px' />
          <Text fontSize='xs' color={mutedColor} textAlign='center'>
            {selectedDay
              ? 'Sin citas este día'
              : 'Sin citas agendadas. Selecciona un día o usa "Agendar".'}
          </Text>
        </Flex>
      ) : (
        list.map((a) => (
          <AppointmentCard key={a.id} appointment={a} onClick={() => onAppointmentClick(a)} />
        ))
      )}
    </Flex>
  );
}

// ── StatsStrip ────────────────────────────────────────────────────────────────

function StatsStrip({ appointments }: { appointments: EnrichedAppointment[] }) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const bg = useColorModeValue('gray.50', 'navy.800');
  const dividerColor = useColorModeValue('gray.200', 'whiteAlpha.200');

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.estado === EstadoCita.CONFIRMADA && new Date(a.scheduledAt) >= now,
  ).length;
  const thisMonth = appointments.filter((a) => {
    const d = new Date(a.scheduledAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const completadas = appointments.filter((a) => a.estado === EstadoCita.COMPLETADA).length;
  const noAsistio = appointments.filter((a) => a.estado === EstadoCita.NO_ASISTIO).length;

  const stats: { label: string; value: number; color: string }[] = [
    { label: 'Total', value: appointments.length, color: textColor },
    { label: 'Próximas', value: upcoming, color: 'blue.500' },
    { label: 'Completadas', value: completadas, color: 'green.500' },
    { label: 'No asistió', value: noAsistio, color: 'gray.400' },
  ];

  return (
    <Flex bg={bg} borderRadius='14px' p='12px 16px' mb='16px' justify='space-around'>
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <Box w='1px' bg={dividerColor} mx='8px' alignSelf='stretch' />}
          <Flex direction='column' align='center' gap='2px'>
            <Text fontSize='lg' fontWeight='800' color={s.color} lineHeight='1.1'>
              {s.value}
            </Text>
            <Text
              fontSize='9px'
              fontWeight='700'
              color={mutedColor}
              textTransform='uppercase'
              letterSpacing='wider'>
              {s.label}
            </Text>
          </Flex>
        </React.Fragment>
      ))}
    </Flex>
  );
}

// ── CitasTab ──────────────────────────────────────────────────────────────────

interface CitasTabProps {
  patient: Patient;
}

export default function CitasTab({ patient }: CitasTabProps) {
  const { user } = useUser();
  const role = getUserRole(user) ?? '';
  const canWrite = ['admin', 'medico', 'fisioterapeuta'].includes(role);
  const isAdmin = role === 'admin';

  const { data: currentDbUser } = useCurrentDbUser();

  const { data: result, isLoading } = useAppointmentsByPatient(patient.id, { limit: 100 });
  const appointments = result?.data ?? [];

  const now = new Date();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const [selected, setSelected] = useState<EnrichedAppointment | null>(null);
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const emptyBg = useColorModeValue('gray.50', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const activeToggleBg = useColorModeValue('white', 'navy.700');
  const toggleBg = useColorModeValue('gray.100', 'navy.800');

  const upcoming = appointments
    .filter((a) => a.estado === EstadoCita.CONFIRMADA && new Date(a.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const past = appointments
    .filter((a) => a.estado !== EstadoCita.CONFIRMADA || new Date(a.scheduledAt) < now)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const dayAppointments = selectedDay
    ? appointments
        .filter((a) => isSameDay(new Date(a.scheduledAt), selectedDay))
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    : [];

  function handleMonthChange(y: number, m: number) {
    setCalYear(y);
    setCalMonth(m);
    setSelectedDay(null);
  }

  function handleAppointmentClick(a: EnrichedAppointment) {
    setSelected(a);
    onDetailOpen();
  }

  if (isLoading) {
    return (
      <Box p='20px'>
        <Skeleton h='60px' borderRadius='14px' mb='12px' />
        <Skeleton h='300px' borderRadius='14px' />
      </Box>
    );
  }

  return (
    <Box p='20px'>
      {/* Header */}
      <Flex align='center' justify='space-between' mb='16px'>
        <Text
          fontSize='xs'
          fontWeight='800'
          color={mutedColor}
          textTransform='uppercase'
          letterSpacing='wider'>
          Citas ({appointments.length})
        </Text>
        <Flex align='center' gap='8px'>
          {/* View toggle */}
          <Flex bg={toggleBg} borderRadius='10px' p='3px' gap='1px'>
            {(
              [
                { mode: 'calendar', icon: MdCalendarMonth, label: 'Calendario' },
                { mode: 'list', icon: MdList, label: 'Lista' },
              ] as const
            ).map(({ mode, icon, label }) => (
              <Flex
                key={mode}
                align='center'
                gap='4px'
                px='10px'
                py='5px'
                borderRadius='8px'
                cursor='pointer'
                bg={viewMode === mode ? activeToggleBg : 'transparent'}
                boxShadow={viewMode === mode ? 'sm' : 'none'}
                onClick={() => setViewMode(mode)}
                transition='all 0.15s'>
                <Icon
                  as={icon}
                  w='14px'
                  h='14px'
                  color={viewMode === mode ? 'brand.500' : mutedColor}
                />
                <Text
                  fontSize='xs'
                  fontWeight='700'
                  color={viewMode === mode ? textColor : mutedColor}>
                  {label}
                </Text>
              </Flex>
            ))}
          </Flex>

          {canWrite && (
            <Button size='sm' leftIcon={<Icon as={MdAdd} />} colorScheme='blue' onClick={onCreateOpen}>
              Agendar
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Stats strip */}
      {appointments.length > 0 && <StatsStrip appointments={appointments} />}

      {/* Content */}
      {viewMode === 'calendar' ? (
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap='20px' alignItems='start'>
          {/* Calendar */}
          <Box border='1px solid' borderColor={borderColor} borderRadius='16px' p='20px'>
            <MiniCalendar
              year={calYear}
              month={calMonth}
              appointments={appointments}
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
              onMonthChange={handleMonthChange}
            />
          </Box>

          {/* Day / upcoming panel */}
          <DayPanel
            selectedDay={selectedDay}
            dayAppointments={dayAppointments}
            upcomingAppointments={upcoming}
            onAppointmentClick={handleAppointmentClick}
          />
        </Grid>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Box mb='24px'>
              <Text
                fontSize='xs'
                fontWeight='800'
                color={mutedColor}
                textTransform='uppercase'
                letterSpacing='wider'
                mb='10px'>
                Próximas ({upcoming.length})
              </Text>
              <Flex direction='column' gap='8px'>
                {upcoming.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onClick={() => handleAppointmentClick(a)}
                  />
                ))}
              </Flex>
            </Box>
          )}
          {past.length > 0 && (
            <Box>
              <Text
                fontSize='xs'
                fontWeight='800'
                color={mutedColor}
                textTransform='uppercase'
                letterSpacing='wider'
                mb='10px'>
                Historial ({past.length})
              </Text>
              <Flex direction='column' gap='8px'>
                {past.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onClick={() => handleAppointmentClick(a)}
                  />
                ))}
              </Flex>
            </Box>
          )}
        </>
      )}

      <AppointmentFormModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        patientId={patient.id}
        isAdmin={isAdmin}
      />

      {selected && (
        <AppointmentDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            onDetailClose();
            setSelected(null);
          }}
          appointment={selected}
          canWrite={canWrite}
          isAdmin={isAdmin}
          currentUserId={currentDbUser?.id}
        />
      )}
    </Box>
  );
}

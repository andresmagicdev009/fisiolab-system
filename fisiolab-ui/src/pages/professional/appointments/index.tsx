import React, { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Icon,
  IconButton,
  Portal,
  Skeleton,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { useUser } from '@clerk/clerk-react';
import Button from 'components/ui/Button';
import { useAppointments } from 'hooks/useAppointments';
import { useCurrentDbUser } from 'hooks/useCurrentUser';
import AppointmentCancelModal from 'components/layouts/patients/AppointmentCancelModal';
import AppointmentCompleteModal from 'components/layouts/patients/AppointmentCompleteModal';
import AppointmentFormModal from 'components/layouts/patients/AppointmentFormModal';
import {
  MdAdd,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdPerson,
  MdSchedule,
  MdTimer,
  MdToday,
} from 'react-icons/md';
import { Appointment, EstadoCita, TipoCita } from 'types/models';
import { getUserRole } from 'utils/auth';
import './AgendaView.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const START_HOUR  = 7;
const END_HOUR    = 20;
const HOUR_PX     = 64;
const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX;
const HOURS       = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

const DAY_ABBR_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_ES    = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                     'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ─── Appointment styling ──────────────────────────────────────────────────────
const TIPO_STYLE: Record<TipoCita, { bg: string; text: string }> = {
  [TipoCita.PRIMERA_VEZ]:   { bg: '#7C3AED', text: '#FFFFFF' },
  [TipoCita.SEGUIMIENTO]:   { bg: '#0891B2', text: '#FFFFFF' },
  [TipoCita.INTERCONSULTA]: { bg: '#EA580C', text: '#FFFFFF' },
};
const TIPO_BADGE: Record<TipoCita, string> = {
  [TipoCita.PRIMERA_VEZ]:   'purple',
  [TipoCita.SEGUIMIENTO]:   'cyan',
  [TipoCita.INTERCONSULTA]: 'orange',
};
const TIPO_LABEL: Record<TipoCita, string> = {
  [TipoCita.PRIMERA_VEZ]:   'Primera vez',
  [TipoCita.SEGUIMIENTO]:   'Seguimiento',
  [TipoCita.INTERCONSULTA]: 'Interconsulta',
};
const ESTADO_LABEL: Record<EstadoCita, string> = {
  [EstadoCita.CONFIRMADA]:   'Confirmada',
  [EstadoCita.CANCELADA]:    'Cancelada',
  [EstadoCita.COMPLETADA]:   'Completada',
  [EstadoCita.REPROGRAMADA]: 'Reprogramada',
  [EstadoCita.NO_ASISTIO]:   'No asistió',
};
const ESTADO_BADGE: Record<EstadoCita, string> = {
  [EstadoCita.CONFIRMADA]:   'blue',
  [EstadoCita.CANCELADA]:    'red',
  [EstadoCita.COMPLETADA]:   'green',
  [EstadoCita.REPROGRAMADA]: 'purple',
  [EstadoCita.NO_ASISTIO]:   'gray',
};
const FADED_ESTADOS = new Set<EstadoCita>([
  EstadoCita.CANCELADA, EstadoCita.COMPLETADA, EstadoCita.NO_ASISTIO,
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function toApiDate(date: Date): string {
  return toDateKey(date);
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function fmtEndTime(iso: string, dur: number): string {
  const d = new Date(new Date(iso).getTime() + dur * 60_000);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function getTopPx(iso: string): number {
  const d = new Date(iso);
  return Math.max(0, (d.getHours() + d.getMinutes() / 60 - START_HOUR) * HOUR_PX);
}

function getHeightPx(dur: number): number {
  return Math.max(22, (dur / 60) * HOUR_PX);
}

function nowTopPx(): number {
  const d = new Date();
  return (d.getHours() + d.getMinutes() / 60 - START_HOUR) * HOUR_PX;
}

// ─── Popup ────────────────────────────────────────────────────────────────────
interface PopupProps {
  appt: Appointment;
  pos: { x: number; y: number };
  canWrite: boolean;
  isAdmin: boolean;
  currentUserId: string | undefined;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onComplete: () => void;
}

function AppointmentPopup({ appt, pos, canWrite, isAdmin, currentUserId, onClose, onEdit, onCancel, onComplete }: PopupProps) {
  const ref     = useRef<HTMLDivElement>(null);
  const isConf  = appt.estado === EstadoCita.CONFIRMADA;
  const canComp = isConf && (isAdmin || appt.professionalId === currentUserId);

  const [style, setStyle] = useState<React.CSSProperties>({ left: pos.x + 12, top: pos.y });

  useEffect(() => {
    if (!ref.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { width, height } = ref.current.getBoundingClientRect();
    let x = pos.x + 12;
    let y = pos.y - 20;
    if (x + width + 12 > vw)  x = pos.x - width - 12;
    if (y + height + 12 > vh)  y = vh - height - 12;
    if (y < 8)                 y = 8;
    setStyle({ left: x, top: y });
  }, [pos]);

  return (
    <>
      <div className="ag-backdrop" onClick={onClose} />
      <Portal>
        <div ref={ref} className="ag-popup" style={style}>
          <div className="ag-popup-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="ag-popup-title">
                {appt.patient.nombres} {appt.patient.apellidos}
              </p>
              <div className="ag-popup-meta">
                <Badge colorScheme={TIPO_BADGE[appt.tipoCita]} fontSize="10px" borderRadius="full" px="7px">
                  {TIPO_LABEL[appt.tipoCita]}
                </Badge>
                <Badge colorScheme={ESTADO_BADGE[appt.estado]} variant="subtle" fontSize="10px" borderRadius="full" px="7px">
                  {ESTADO_LABEL[appt.estado]}
                </Badge>
              </div>
            </div>
            <button className="ag-popup-close" onClick={onClose} aria-label="Cerrar">
              <Icon as={MdClose} w="16px" h="16px" />
            </button>
          </div>

          <div className="ag-popup-body">
            <div className="ag-popup-row">
              <Icon as={MdSchedule} className="ag-popup-row-icon" w="14px" h="14px" />
              <span>{fmtTime(appt.scheduledAt)} – {fmtEndTime(appt.scheduledAt, appt.durationMinutes)}</span>
            </div>
            <div className="ag-popup-row">
              <Icon as={MdTimer} className="ag-popup-row-icon" w="14px" h="14px" />
              <span>{appt.durationMinutes} min</span>
            </div>
            <div className="ag-popup-row">
              <Icon as={MdPerson} className="ag-popup-row-icon" w="14px" h="14px" />
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{appt.patient.cedula}</span>
            </div>
            {appt.motivo && (
              <div className="ag-popup-row" style={{ color: '#64748B', fontSize: 12 }}>
                <span style={{ paddingLeft: 24 }}>{appt.motivo}</span>
              </div>
            )}
          </div>

          {(isConf && canWrite) || canComp ? (
            <div className="ag-popup-actions">
              {isConf && canWrite && (
                <Button size="xs" variant="outline" onClick={onEdit}>Editar</Button>
              )}
              {canComp && (
                <Button size="xs" colorScheme="green" onClick={onComplete}>Completar</Button>
              )}
              {isConf && canWrite && (
                <Button size="xs" colorScheme="red" variant="outline" onClick={onCancel}>Cancelar</Button>
              )}
            </div>
          ) : null}
        </div>
      </Portal>
    </>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export default function AppointmentsView() {
  const { user }              = useUser();
  const role                  = getUserRole(user) ?? '';
  const canWrite              = ['admin', 'medico', 'fisioterapeuta'].includes(role);
  const isAdmin               = role === 'admin';
  const { data: currentDbUser } = useCurrentDbUser();
  const toast                 = useToast();

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd  = weekDays[6];

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday  = () => setWeekStart(getMonday(new Date()));

  const { data: result, isLoading } = useAppointments({
    desde: toApiDate(weekStart),
    hasta: toApiDate(weekEnd),
    limit: 300,
  });

  const byDay = React.useMemo<Record<string, Appointment[]>>(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of result?.data ?? []) {
      const key = toDateKey(new Date(a.scheduledAt));
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [result]);

  const [timeTop, setTimeTop] = useState(nowTopPx);
  useEffect(() => {
    const id = setInterval(() => setTimeTop(nowTopPx()), 60_000);
    return () => clearInterval(id);
  }, []);

  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = HOUR_PX;
    }
  }, []);

  const [popup, setPopup]   = useState<{ appt: Appointment; pos: { x: number; y: number } } | null>(null);
  const closePopup          = () => setPopup(null);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const [editTarget,     setEditTarget]     = useState<Appointment | null>(null);
  const [cancelTarget,   setCancelTarget]   = useState<Appointment | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null);

  const openEdit     = (a: Appointment) => { closePopup(); setEditTarget(a);     };
  const openCancel   = (a: Appointment) => { closePopup(); setCancelTarget(a);   };
  const openComplete = (a: Appointment) => { closePopup(); setCompleteTarget(a); };

  const startMonth = weekStart.getMonth();
  const endMonth   = weekEnd.getMonth();
  const yearLabel  = weekStart.getFullYear();
  const monthLabel = startMonth === endMonth
    ? `${MONTH_ES[startMonth]} ${yearLabel}`
    : `${MONTH_ES[startMonth]} / ${MONTH_ES[endMonth]} ${yearLabel}`;

  const todayKey = toDateKey(new Date());

  const cardBg      = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const headerBg    = useColorModeValue('gray.50', 'navy.700');
  const textColor   = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor  = useColorModeValue('secondaryGray.500', 'secondaryGray.400');

  return (
    <Box pt="80px" px={{ base: '12px', md: '24px' }} maxW="1400px" mx="auto">
      <Flex align="center" justify="space-between" mb="20px" flexWrap="wrap" gap="12px">
        <Flex align="center" gap="8px">
          <Tooltip label="Semana actual" hasArrow>
            <Button size="sm" variant="outline" onClick={goToday} leftIcon={<Icon as={MdToday} />}>
              Hoy
            </Button>
          </Tooltip>
          <Flex gap="4px">
            <IconButton aria-label="Semana anterior" icon={<Icon as={MdChevronLeft} />} size="sm" variant="ghost" onClick={prevWeek} />
            <IconButton aria-label="Siguiente semana" icon={<Icon as={MdChevronRight} />} size="sm" variant="ghost" onClick={nextWeek} />
          </Flex>
          <Text fontSize="lg" fontWeight="700" color={textColor} minW="180px">
            {monthLabel}
          </Text>
        </Flex>

        <Flex align="center" gap="10px">
          <Badge colorScheme="brand" variant="subtle" borderRadius="full" px="12px" py="5px" fontSize="12px" fontWeight="600">
            Vista semana
          </Badge>
          {canWrite && (
            <Button leftIcon={<Icon as={MdAdd} />} colorScheme="brand" size="sm" onClick={onCreateOpen}>
              Agendar cita
            </Button>
          )}
        </Flex>
      </Flex>

      <Box bg={cardBg} borderRadius="16px" border="1px solid" borderColor={borderColor} overflow="hidden" boxShadow="0 2px 12px rgba(0,0,0,0.06)">
        <Box bg={headerBg} overflowX="auto">
          <div className="ag-day-headers">
            <div className="ag-day-header-spacer" />
            {weekDays.map((day, i) => {
              const key     = toDateKey(day);
              const isToday = key === todayKey;
              return (
                <div key={key} className="ag-day-header-cell">
                  <span className={`ag-day-abbr${isToday ? ' ag-day-abbr--today' : ''}`}>{DAY_ABBR_ES[i]}</span>
                  <span className={`ag-day-num${isToday ? ' ag-day-num--today' : ''}`}>{day.getDate()}</span>
                </div>
              );
            })}
          </div>
        </Box>

        <div className="ag-grid-scroll" ref={gridRef}>
          {isLoading ? (
            <Flex h="400px" px="16px" gap="8px" py="12px">
              <Box w="56px" flexShrink={0} />
              {weekDays.map((_, i) => (
                <div key={i} className="ag-skeleton-col">
                  {i < 5 && (
                    <>
                      <Skeleton h="52px" borderRadius="8px" opacity={0.6} />
                      {i % 2 === 0 && <Skeleton h="36px" borderRadius="8px" opacity={0.4} mt="48px" />}
                    </>
                  )}
                </div>
              ))}
            </Flex>
          ) : (
            <div className="ag-grid-body">
              <div className="ag-time-col" style={{ height: GRID_HEIGHT }}>
                {HOURS.map(h => (
                  <div key={h} className="ag-time-label" style={{ top: (h - START_HOUR) * HOUR_PX }}>
                    {h}:00
                  </div>
                ))}
              </div>

              <div className="ag-days-area">
                {weekDays.map((day, i) => {
                  const key     = toDateKey(day);
                  const isToday = key === todayKey;
                  const appts   = byDay[key] ?? [];

                  return (
                    <div
                      key={key}
                      className={`ag-day-col${isToday ? ' ag-day-col--today' : ''}`}
                      style={{ height: GRID_HEIGHT }}
                      onClick={e => {
                        if ((e.target as HTMLElement).classList.contains('ag-day-col')) {
                          if (canWrite) onCreateOpen();
                        }
                      }}
                    >
                      {HOURS.map(h => (
                        <div key={h} className="ag-hour-line" style={{ top: (h - START_HOUR) * HOUR_PX }} />
                      ))}
                      {HOURS.slice(0, -1).map(h => (
                        <div key={`${h}-half`} className="ag-hour-line ag-hour-line--half" style={{ top: (h - START_HOUR) * HOUR_PX + HOUR_PX / 2 }} />
                      ))}

                      {isToday && timeTop >= 0 && timeTop <= GRID_HEIGHT && (
                        <div className="ag-now-line" style={{ top: timeTop }} />
                      )}

                      {appts.map(appt => {
                        const style  = TIPO_STYLE[appt.tipoCita];
                        const top    = getTopPx(appt.scheduledAt);
                        const height = getHeightPx(appt.durationMinutes);
                        const faded  = FADED_ESTADOS.has(appt.estado);
                        const tall   = height >= 36;

                        return (
                          <div
                            key={appt.id}
                            className={`ag-appt${faded ? ' ag-appt--faded' : ''}`}
                            style={{ top, height, background: style.bg, color: style.text }}
                            onClick={e => {
                              e.stopPropagation();
                              setPopup({ appt, pos: { x: e.clientX, y: e.clientY } });
                            }}
                          >
                            {tall && (
                              <div className="ag-appt-patient">
                                {appt.patient.nombres} {appt.patient.apellidos}
                              </div>
                            )}
                            <div className="ag-appt-time">
                              {fmtTime(appt.scheduledAt)}
                              {tall && ` – ${fmtEndTime(appt.scheduledAt, appt.durationMinutes)}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Box>

      {popup && (
        <AppointmentPopup
          appt={popup.appt}
          pos={popup.pos}
          canWrite={canWrite}
          isAdmin={isAdmin}
          currentUserId={currentDbUser?.id}
          onClose={closePopup}
          onEdit={() => openEdit(popup.appt)}
          onCancel={() => openCancel(popup.appt)}
          onComplete={() => openComplete(popup.appt)}
        />
      )}

      <AppointmentFormModal isOpen={isCreateOpen} onClose={onCreateClose} isAdmin={isAdmin} />
      {editTarget && (
        <AppointmentFormModal isOpen onClose={() => setEditTarget(null)} patientId={editTarget.patientId} appointment={editTarget} isAdmin={isAdmin} />
      )}
      {cancelTarget && (
        <AppointmentCancelModal isOpen onClose={() => setCancelTarget(null)} appointment={cancelTarget} />
      )}
      {completeTarget && (
        <AppointmentCompleteModal isOpen onClose={() => setCompleteTarget(null)} appointment={completeTarget} />
      )}
    </Box>
  );
}

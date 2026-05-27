import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { useCurrentDbUser } from 'hooks/useCurrentUser';
import { useBatchReplaceAvailability } from 'hooks/useAvailability';
import { useUpdateCapacidad } from 'hooks/useUsers';
import { getUserRole, getRoleRedirect } from 'utils/auth';
import { AgendaCalendar } from 'components/calendar/Calendar';
import Dropdown, { DropdownItem } from 'components/ui/Dropdown';
import { TimeCombobox } from 'components/ui/TimeCombobox';
import { Box, Flex, Heading, Text, Badge, Input, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Button } from '@chakra-ui/react';
import CustomModal from 'components/modal/Modal';
import { FooterOnBoarding } from 'components/footer/FooterOnBoarding';
import { MdContentCopy, MdRefresh, MdClose } from 'react-icons/md';
import './OnboardingWizard.css';

const DAYS = [
  { id: 'sunday', abbr: 'Dom', label: 'Dom' },
  { id: 'monday', abbr: 'Lun', label: 'Lun' },
  { id: 'tuesday', abbr: 'Mar', label: 'Mar' },
  { id: 'wednesday', abbr: 'Mié', label: 'Mié' },
  { id: 'thursday', abbr: 'Jue', label: 'Jue' },
  { id: 'friday', abbr: 'Vie', label: 'Vie' },
  { id: 'saturday', abbr: 'Sáb', label: 'Sáb' },
] as const;

const DURATIONS = [15, 30, 45, 60] as const;

type DayId = typeof DAYS[number]['id'];

interface TimePeriod {
  startTime: string;
  endTime: string;
}

interface DayConfig {
  enabled: boolean;
  periods: TimePeriod[];
}

const DEFAULT_DAYS: Record<DayId, DayConfig> = {
  sunday:    { enabled: false, periods: [{ startTime: '08:00', endTime: '13:00' }] },
  monday:    { enabled: true,  periods: [{ startTime: '08:00', endTime: '17:00' }] },
  tuesday:   { enabled: true,  periods: [{ startTime: '08:00', endTime: '17:00' }] },
  wednesday: { enabled: true,  periods: [{ startTime: '08:00', endTime: '17:00' }] },
  thursday:  { enabled: true,  periods: [{ startTime: '08:00', endTime: '17:00' }] },
  friday:    { enabled: true,  periods: [{ startTime: '08:00', endTime: '17:00' }] },
  saturday:  { enabled: false, periods: [{ startTime: '08:00', endTime: '13:00' }] },
};

const TIME_OPTIONS: DropdownItem[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  const label = `${h}:${m}`;
  return { label, value: label };
});

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 } },
};

const rowVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
};

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const { data: dbUser } = useCurrentDbUser();
  const [days, setDays] = useState<Record<DayId, DayConfig>>(DEFAULT_DAYS);
  const [duration, setDuration] = useState<number>(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [modalValue, setModalValue] = useState<number>(30);
  const [modalUnit, setModalUnit] = useState<'minutes' | 'hours'>('minutes');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const mutation = useBatchReplaceAvailability(dbUser?.id ?? '');
  const capacidadMutation = useUpdateCapacidad();
  const [capacity, setCapacity] = useState<number>(dbUser?.capacidadAtencionParalela ?? 1);

  const toggleDay = (dayId: DayId) =>
    setDays(prev => ({ ...prev, [dayId]: { ...prev[dayId], enabled: !prev[dayId].enabled } }));

  const updateTime = (dayId: DayId, idx: number, field: 'startTime' | 'endTime', value: string) =>
    setDays(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        periods: prev[dayId].periods.map((p, i) => i === idx ? { ...p, [field]: value } : p),
      },
    }));

  const addPeriod = (dayId: DayId) =>
    setDays(prev => ({
      ...prev,
      [dayId]: {
        enabled: true,
        periods: [...prev[dayId].periods, { startTime: '08:00', endTime: '17:00' }],
      },
    }));

  const copyToAll = (dayId: DayId) => {
    const src = days[dayId];
    setDays(prev => {
      const next = { ...prev };
      DAYS.forEach(d => {
        if (next[d.id].enabled && d.id !== dayId) {
          next[d.id] = { ...next[d.id], periods: [...src.periods] };
        }
      });
      return next;
    });
  };

  const removePeriod = (dayId: DayId, idx: number) => {
    const periods = days[dayId].periods;
    if (periods.length === 1) {
      toggleDay(dayId);
    } else {
      setDays(prev => ({
        ...prev,
        [dayId]: { ...prev[dayId], periods: prev[dayId].periods.filter((_, i) => i !== idx) },
      }));
    }
  };

  const resetDay = (dayId: DayId) =>
    setDays(prev => ({ ...prev, [dayId]: { ...DEFAULT_DAYS[dayId], enabled: prev[dayId].enabled } }));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!dbUser?.id) {
      setError('Error de sesión. Recarga la página e intenta de nuevo.');
      return;
    }

    const activeDays = DAYS.filter(d => days[d.id].enabled);

    if (activeDays.length === 0) {
      setError('Selecciona al menos un día de atención.');
      return;
    }

    for (const day of activeDays) {
      for (const p of days[day.id].periods) {
        if (p.startTime >= p.endTime) {
          setError(`${day.label}: la hora de inicio debe ser anterior a la hora fin.`);
          return;
        }
      }
    }

    const slots = activeDays.flatMap(day =>
      days[day.id].periods.map(p => ({
        dayOfWeek: day.id,
        startTime: p.startTime,
        endTime: p.endTime,
        slotDurationMinutes: duration,
        zonaHoraria: 'America/Guayaquil',
      }))
    );

    try {
      await Promise.all([
        mutation.mutateAsync(slots),
        capacidadMutation.mutateAsync({ id: dbUser.id, capacidad: capacity }),
      ]);
      setSucceeded(true);
      const role = clerkUser ? getUserRole(clerkUser) : undefined;
      setTimeout(() => navigate(getRoleRedirect(role), { replace: true }), 1600);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' · ') : (msg ?? 'Error al guardar la disponibilidad.'));
    }
  };

  return (
    <div className="ob-page">
      <div className="ob-bg-orb ob-bg-orb-1" />
      <div className="ob-bg-orb ob-bg-orb-2" />
      <div className="ob-bg-orb ob-bg-orb-3" />

      <div className="ob-layout">
        <div className='ob-config-panel'>
          <div className='ob-config-inner'>

          {/* Header */}
          <Box w="100%" mb="28px">
            <Flex alignItems="center" gap="10px" mb="8px">
              <Heading as="h1" size="lg" mb={0} color="navy.800" letterSpacing="-0.02em">
                Configura tu disponibilidad
              </Heading>
              <Box
                as="svg"
                xmlns="http://www.w3.org/2000/svg"
                width="22px"
                height="22px"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                color="secondaryGray.500"
                flexShrink={0}
              >
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M16 2v4" /><path d="M3 10h18" /><path d="M8 2v4" />
                <path d="M17 14h-6" /><path d="M13 18H7" />
                <path d="M7 14h.01" /><path d="M17 18h.01" />
              </Box>
            </Flex>
            <Text fontSize="sm" color="secondaryGray.600" >
              Define tu horario semanal de atención para que los pacientes puedan agendarse contigo.
            </Text>
            
          </Box>

          {/* Repetición */}
          <Box mb="28px">
            <Text
              fontSize="10px"
              fontWeight="700"
              color="secondaryGray.500"
              letterSpacing="0.1em"
              textTransform="uppercase"
              mb="10px"
            >
              Repetición
            </Text>
            <Dropdown
              label={{ weekly: 'Cada semana', biweekly: 'Cada 2 semanas', monthly: 'Mensualmente' }[frequency]}
              items={[
                { label: 'Cada semana', value: 'weekly' },
                { label: 'Cada 2 semanas', value: 'biweekly' },
                { label: 'Mensualmente', value: 'monthly' },
              ]}
              onSelect={(value) => setFrequency(value as 'weekly' | 'biweekly' | 'monthly')}
              w="100%"
              variant="outline"
              size="sm"
            />
          </Box>

          {/* Duración + Capacidad */}
          <Box mb="28px">
            <Flex gap="12px">
              <Box flex={1}>
                <Text fontSize="10px" fontWeight="700" color="secondaryGray.500" letterSpacing="0.1em" textTransform="uppercase" mb="10px">
                  Duración de sesión
                </Text>
                <Dropdown
                  label={
                    isCustomDuration
                      ? `Personaliz... (${duration < 60 ? duration + ' min' : duration / 60 + ' h'})`
                      : duration === 15 ? '15 min'
                      : duration === 30 ? '30 min'
                      : duration === 45 ? '45 min'
                      : duration === 60 ? '1 h'
                      : duration === 90 ? '1.5 h'
                      : '2 h'
                  }
                  items={[
                    { label: '15 min',        value: 15 },
                    { label: '30 min',        value: 30 },
                    { label: '45 min',        value: 45 },
                    { label: '1 h',           value: 60 },
                    { label: '1.5 h',         value: 90 },
                    { label: '2 h',           value: 120 },
                    { label: 'Personaliz...', value: -1 },
                  ]}
                  onSelect={(value) => {
                    const v = Number(value);
                    if (v === -1) { setShowCustomModal(true); }
                    else { setDuration(v); setIsCustomDuration(false); }
                  }}
                  w="100%"
                  variant="outline"
                  size="sm"
                />
              </Box>
              <Box flex={1}>
                <Text fontSize="10px" fontWeight="700" color="secondaryGray.500" letterSpacing="0.1em" textTransform="uppercase" mb="10px">
                  Capacidad por Sesión
                </Text>
                <Dropdown
                  label={capacity === 1 ? 'Un paciente' : capacity === 2 ? 'Dos pacientes' : 'Tres pacientes'}
                  items={[
                    { label: 'Un paciente',    value: 1 },
                    { label: 'Dos pacientes',  value: 2 },
                    { label: 'Tres pacientes', value: 3 },
                  ]}
                  onSelect={(v) => setCapacity(Number(v))}
                  w="100%"
                  variant="outline"
                  size="sm"
                />
              </Box>
            </Flex>
          </Box>

          {/* Horario semanal */}
          <Box>
            <Text
              fontSize="10px"
              fontWeight="700"
              color="secondaryGray.500"
              letterSpacing="0.1em"
              textTransform="uppercase"
              mb="4px"
            >
              Horario semanal
            </Text>
            {DAYS.map(day => {
              const unavailable = !days[day.id].enabled;
              return (
                <Flex
                  key={day.id}
                  alignItems="center"
                  py="18px"
                  
                  gap="20px"
                  opacity={unavailable ? 0.98 : 1}
                  transition="opacity 0.2s"
                >
                  {/* Day label */}
                  <Text
                    fontSize="sm"
                    fontWeight="700"
                    color={unavailable ? 'secondaryGray.500' : 'secondaryGray.700'}
                    letterSpacing="0.05em"
                    textTransform="uppercase"
                    minW="44px"
                    flexShrink={0}
                  >
                    {day.label}
                  </Text>

                  {/* Periods or unavailable label */}
                  <Flex flex={1} direction="column" gap="6px">
                    {unavailable ? (
                      <Text fontSize="sm" color="secondaryGray.500" >
                        No disponible
                      </Text>
                    ) : (
                      (days[day.id].periods ?? []).map((period, idx) => (
                        <Flex key={idx} alignItems="center" gap="8px">
                          <TimeCombobox
                            value={period.startTime}
                            onChange={(value) => updateTime(day.id, idx, 'startTime', value)}
                            options={TIME_OPTIONS.map(t => t.value as string)}
                            listMaxH="170px"
                            flex={1}
                            w="0"
                          />
                          <Text fontSize="sm" color="secondaryGray.500" flexShrink={0} userSelect="none">–</Text>
                          <TimeCombobox
                            value={period.endTime}
                            onChange={(value) => updateTime(day.id, idx, 'endTime', value)}
                            options={TIME_OPTIONS.map(t => t.value as string)}
                            listMaxH="180px"
                            flex={1}
                            w="0"
                          />
                          {/* Octagon-minus */}
                          <Box
                            as="button"
                            type="button"
                            onClick={() => removePeriod(day.id, idx)}
                            color="secondaryGray.800"
                            _hover={{ color: 'red.400' }}
                            transition="color 0.15s"
                            cursor="pointer"
                            bg="transparent"
                            border="none"
                            p="0"
                            display="flex"
                            alignItems="center"
                            flexShrink={0}
                            title="Quitar periodo"
                          >
                            <Box as="svg" xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z" />
                              <path d="M8 12h8" />
                            </Box>
                          </Box>
                        </Flex>
                      ))
                    )}
                  </Flex>

                  {/* Zona fija de acciones — siempre a la derecha, ancho constante */}
                  <Flex flexShrink={0} gap="8px" alignItems="center">
                    {!unavailable && (
                      <>
                        <Box
                          as="button"
                          type="button"
                          onClick={() => copyToAll(day.id)}
                          color="secondaryGray.800"
                          _hover={{ color: 'secondaryGray.900' }}
                          transition="color 0.15s"
                          cursor="pointer"
                          bg="transparent"
                          border="none"
                          p="0"
                          display="flex"
                          alignItems="center"
                          title="Copiar intervalos a todos los días"
                        >
                          <Box as="svg" xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                          </Box>
                        </Box>
                      </>
                    )}
                    <Box
                      as="button"
                      type="button"
                      onClick={() => unavailable ? toggleDay(day.id) : addPeriod(day.id)}
                      color="brand.500"
                      _hover={{ color: 'brand.600' }}
                      transition="color 0.15s"
                      cursor="pointer"
                      bg="transparent"
                      border="none"
                      p="0"
                      display="flex"
                      alignItems="center"
                      title={unavailable ? 'Restaurar día' : 'Añadir periodo'}
                    >
                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                        <path d="M12 8v8" />
                      </Box>
                    </Box>
                  </Flex>
                </Flex>
              );
            })}
          </Box>

          {error && (
            <Text fontSize="sm" color="red.500" mb="12px">{error}</Text>
          )}

          <Button
            w="100%"
            bg="brand.500"
            color="white"
            _hover={{ bg: 'brand.600' }}
            size="md"
            borderRadius="12px"
            fontWeight="600"
            onClick={handleSubmit}
            isLoading={mutation.isPending || capacidadMutation.isPending}
            mb="24px"
          >
            Guardar disponibilidad
          </Button>

          <FooterOnBoarding />

          </div>
        </div>
        <div className="ob-calendar-panel">

          <AgendaCalendar
            cardWidth="100%"
            cardHeight="calc(100vh - 60px)"
            justify="flex-start"
            align="flex-start"
            availability={days}
            frequency={frequency}
          />


        </div>

      </div>



      <CustomModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Duración personalizada"
        size="sm"
        primaryBtnLabel="Hecho"
        secondaryBtnLabel="Cancelar"
        onPrimaryClick={() => {
          const mins = modalUnit === 'hours' ? modalValue * 60 : modalValue;
          if (mins > 0) {
            setDuration(mins);
            setIsCustomDuration(true);
          }
          setShowCustomModal(false);
        }}
      >
        <Flex alignItems="center" gap="10px">
          <NumberInput
            value={modalValue}
            onChange={(_, v) => setModalValue(isNaN(v) ? 1 : v)}
            min={1}
            max={modalUnit === 'hours' ? 8 : 480}
            flex={1}
            size="sm"
          >
            <NumberInputField borderRadius="8px" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Dropdown
            label={modalUnit === 'minutes' ? 'Minutos' : 'Horas'}
            items={[
              { label: 'Minutos', value: 'minutes' },
              { label: 'Horas',   value: 'hours' },
            ]}
            onSelect={(v) => setModalUnit(v as 'minutes' | 'hours')}
            size="sm"
            variant="outline"
            flexShrink={0}
          />
        </Flex>
      </CustomModal>
    </div >
  );
}

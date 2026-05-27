import React, { useState } from 'react';
import {
  Box,
  Flex,
  Button,
  Icon,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import Card from 'components/card/Card';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { renderTrack, renderThumb, renderView } from 'components/scrollbar/Scrollbar';


const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_ABBR_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface AvailabilityPeriod {
  startTime: string;
  endTime: string;
}
interface AvailabilityDayConfig {
  enabled: boolean;
  periods: AvailabilityPeriod[];
}

interface AgendaCalendarProps {
  onSelectDate?: (date: Date) => void;
  cardWidth?: string | number;
  cardHeight?: string | number;
  cellHeight?: string | number;
  justify?: 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around';
  align?: 'center' | 'flex-start' | 'flex-end' | 'stretch';
  availability?: Record<string, AvailabilityDayConfig>;
  frequency?: 'weekly' | 'biweekly' | 'monthly';
}

const WEEK_DAY_IDS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function isHourCovered(periods: AvailabilityPeriod[], hour: number): boolean {
  return periods.some(p => {
    const [sh, sm] = p.startTime.split(':').map(Number);
    const [eh, em] = p.endTime.split(':').map(Number);
    const start = sh + sm / 60;
    const end = eh + em / 60;
    return start <= hour && end > hour;
  });
}

export const AgendaCalendar: React.FC<AgendaCalendarProps> = ({
  onSelectDate,
  cardWidth = '1100px',
  cardHeight = '80vh',
  cellHeight = '80px',
  justify = 'center',
  align = 'center',
  availability,
  frequency = 'weekly',
}) => {
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const referenceWeek = getMonday(new Date());
  const weekDiff = Math.round((weekStart.getTime() - referenceWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const isActiveWeek =
    frequency === 'weekly' ? true :
    frequency === 'biweekly' ? Math.abs(weekDiff) % 2 === 0 :
    getWeekOfMonth(weekStart) === getWeekOfMonth(referenceWeek);

  const handlePrevWeek = () => {
    setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const handleNextWeek = () => {
    setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const bgHour = useColorModeValue('gray.50', 'whiteAlpha.50');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const todayCellBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const hoverCellBg = useColorModeValue('gray.100', 'whiteAlpha.200');

  return (
    <Flex h="100vh" align={align} justify={justify} p="20px">
      <Card p="20px" borderRadius="10px" w={cardWidth} maxW="1400px" h={cardHeight} display="flex" flexDirection="column">
        {/* Navegación */}
        <Flex justify="space-between" align="center" mb="20px" gap="16px">
          <Button
            size="sm"
            onClick={handlePrevWeek}
            leftIcon={<Icon as={MdChevronLeft} />}
          >
            Anterior
          </Button>
          <Text fontWeight="bold" fontSize="xl" minW="200px" textAlign="center">
            {MONTH_ES[weekStart.getMonth()]} {weekStart.getFullYear()}
          </Text>
          <Button
            size="sm"
            onClick={handleNextWeek}
            rightIcon={<Icon as={MdChevronRight} />}
          >
            Siguiente
          </Button>
        </Flex>

        {/* Encabezados de días */}
        <Flex gap="1px" mb="8px" borderBottom="2px solid" borderColor={borderColor}>
          <Box w="70px" flexShrink={0} />
          {weekDays.map((day, i) => (
            <Box key={i} flex={1} textAlign="center" pb="12px">
              <Text fontSize="sm" fontWeight="bold">
                {DAY_ABBR_ES[i]}
              </Text>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color={isToday(day) ? 'brand.500' : 'inherit'}
              >
                {day.getDate()}
              </Text>
            </Box>
          ))}
        </Flex>



        {/* Grid de horas y días */}
        <Scrollbars
          renderTrackVertical={({ style, ...props }) => (
            <div {...props} style={{ ...style, width: 6, right: 2, top: 2, bottom: 2, borderRadius: 3, background: 'rgba(0,0,0,0.08)' }} />
          )}
          renderThumbVertical={({ style, ...props }) => (
            <div {...props} style={{ ...style, borderRadius: 1.5, background: 'rgba(0,0,0,0.25)', cursor: 'pointer' }} />
          )}
          renderView={(props) => <div {...props} style={{ ...props.style, marginBottom: -22 }} />}
          style={{ flex: 3 }}
        >
          <Box >
            {HOURS.map(hour => (
              <Flex key={hour} gap="1px" borderBottom="1px solid" borderColor={borderColor} minH={cellHeight}>
                {/* Etiqueta de hora */}
                <Box
                  w="70px"
                  flexShrink={0}
                  display="flex"
                  alignItems="flex-start"
                  justifyContent="flex-end"
                  pr="12px"
                  pt="4px"
                  fontSize="sm"
                  color={textColor}
                  fontWeight="500"
                >
                  {hour.toString().padStart(2, '0')}:00
                </Box>

                {/* Celdas de días */}
                {weekDays.map((day, dayIdx) => {
                  const isTodayCell = isToday(day);
                  const dayId = WEEK_DAY_IDS[dayIdx];
                  const dayAvail = availability?.[dayId];
                  const covered = !!(isActiveWeek && dayAvail?.enabled && isHourCovered(dayAvail.periods, hour));
                  const isStart = covered && !(dayAvail?.enabled && isHourCovered(dayAvail.periods, hour - 1));
                  const isEnd   = covered && !(dayAvail?.enabled && isHourCovered(dayAvail.periods, hour + 1));
                  return (
                    <Box
                      key={`${hour}-${dayIdx}`}
                      flex={1}
                      position="relative"
                      borderRight="1px solid"
                      borderColor={borderColor}
                      bg={isTodayCell ? todayCellBg : 'transparent'}
                      cursor="pointer"
                      _hover={{ bg: hoverCellBg }}
                      onClick={() => {
                        const selectedDateTime = new Date(day);
                        selectedDateTime.setHours(hour, 0, 0, 0);
                        onSelectDate?.(selectedDateTime);
                      }}
                    >
                      {covered && (
                        <Box
                          position="absolute"
                          top={isStart ? '2px' : '0'}
                          bottom={isEnd ? '2px' : '0'}
                          left="2px"
                          right="2px"
                          bg="brand.100"
                          borderLeft="3px solid"
                          borderRight="1px solid"
                          borderTop={isStart ? '1px solid' : 'none'}
                          borderBottom={isEnd ? '1px solid' : 'none'}
                          borderColor="brand.400"
                          borderRadius={isStart && isEnd ? '4px' : isStart ? '4px 4px 0 0' : isEnd ? '0 0 4px 4px' : '0'}
                          pointerEvents="none"
                        />
                      )}
                    </Box>
                  );
                })}
              </Flex>
            ))}
          </Box>

        </Scrollbars>

      </Card>
    </Flex>
  );
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekOfMonth(date: Date): number {
  const firstMonday = getMonday(new Date(date.getFullYear(), date.getMonth(), 1));
  const thisMonday = getMonday(date);
  return Math.round((thisMonday.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default AgendaCalendar;
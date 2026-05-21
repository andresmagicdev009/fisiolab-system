import {
  Badge,
  Box,
  Checkbox,
  Collapse,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Skeleton,
  SkeletonText,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { useUser } from '@clerk/clerk-react';
import Button from 'components/ui/Button';
import { useEpisodesByPatient } from 'hooks/useEpisodes';
import { useTarjetero } from 'hooks/useTarjetero';
import { useAllUsers } from 'hooks/useUsers';
import EpisodeActiveCard from 'layouts/patients/EpisodeActiveCard';
import EpisodeCreateModal from 'layouts/patients/EpisodeCreateModal';
import EpisodeSoapSection from 'layouts/patients/EpisodeSoapSection';
import React, { useMemo, useState } from 'react';
import {
  MdAdd,
  MdCalendarToday,
  MdChevronRight,
  MdFilterList,
  MdFolderOff,
  MdSearch,
  MdWarning,
} from 'react-icons/md';
import { ClinicalEpisode, CurrentDbUser, EstadoEpisodio, Patient } from 'types/models';
import { getUserRole } from 'utils/auth';

// ─── Config ────────────────────────────────────────────────────────────────────

const ESTADO_META: Record<
  EstadoEpisodio,
  { label: string; colorScheme: string; dot: string }
> = {
  [EstadoEpisodio.ABIERTO]: { label: 'Abierto', colorScheme: 'blue', dot: '#63B3ED' },
  [EstadoEpisodio.EN_TRATAMIENTO]: { label: 'En Tratamiento', colorScheme: 'orange', dot: '#F6AD55' },
  [EstadoEpisodio.CERRADO]: { label: 'Cerrado', colorScheme: 'green', dot: '#68D391' },
  [EstadoEpisodio.ARCHIVADO]: { label: 'Archivado', colorScheme: 'gray', dot: '#A0AEC0' },
};

const DEFAULT_ESTADOS = new Set([EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO]);

function formatFecha(d: string): string {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function profesionalNombre(u: CurrentDbUser): string {
  return u.nombres && u.apellidos ? `${u.nombres} ${u.apellidos}` : u.email;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  patient: Patient;
}

export default function HistoriaClinicaTab({ patient }: Props) {
  const { user } = useUser();
  const role = getUserRole(user) ?? '';
  const isAdmin = role === 'admin';
  const canWrite = ['admin', 'medico', 'fisioterapeuta'].includes(role);

  const { data: tarjetero, isLoading: tarjeteroLoading } = useTarjetero(patient.id);
  const { data: episodes = [], isLoading: episodesLoading } = useEpisodesByPatient(patient.id);
  const { data: allUsers = [] } = useAllUsers(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [filterEstados, setFilterEstados] = useState<Set<EstadoEpisodio>>(
    new Set(DEFAULT_ESTADOS),
  );
  const [filterProfesional, setFilterProfesional] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [filterSinDx, setFilterSinDx] = useState(false);

  // Expansion: active episodes open by default, past closed by default
  const [expansionOverrides, setExpansionOverrides] = useState<Map<string, boolean>>(new Map());

  // ── Colors ───────────────────────────────────────────────────────────────────
  const bg = useColorModeValue('white', 'navy.800');
  const filterBg = useColorModeValue('gray.50', 'navy.750');
  const filterBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const warningBorder = useColorModeValue('orange.200', 'orange.700');
  const emptyBg = useColorModeValue('gray.50', 'navy.800');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');

  // ── Computed ─────────────────────────────────────────────────────────────────
  const profesionales = useMemo(
    () => allUsers.filter((u) => u.role !== 'paciente'),
    [allUsers],
  );

  const hasActiveFilters = useMemo(() => {
    const sameEstados =
      filterEstados.size === DEFAULT_ESTADOS.size &&
      [...DEFAULT_ESTADOS].every((e) => filterEstados.has(e));
    return (
      !sameEstados ||
      !!filterProfesional ||
      !!filterSearch ||
      !!filterDesde ||
      !!filterHasta ||
      filterSinDx
    );
  }, [filterEstados, filterProfesional, filterSearch, filterDesde, filterHasta, filterSinDx]);

  const filtered = useMemo(() => {
    let result = [...episodes];
    if (filterEstados.size > 0)
      result = result.filter((e) => filterEstados.has(e.estado));
    if (filterProfesional)
      result = result.filter((e) => e.profesionalId === filterProfesional);
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      result = result.filter(
        (e) =>
          e.motivoConsulta.toLowerCase().includes(q) ||
          e.diagnosticoPrincipal?.toLowerCase().includes(q) ||
          e.codigoCie10?.toLowerCase().includes(q),
      );
    }
    if (filterDesde) result = result.filter((e) => e.fechaApertura >= filterDesde);
    if (filterHasta) result = result.filter((e) => e.fechaApertura <= filterHasta);
    if (filterSinDx) result = result.filter((e) => !e.diagnosticoPrincipal);
    return result.sort((a, b) => b.fechaApertura.localeCompare(a.fechaApertura));
  }, [
    episodes,
    filterEstados,
    filterProfesional,
    filterSearch,
    filterDesde,
    filterHasta,
    filterSinDx,
  ]);

  const activeFiltered = filtered.filter(
    (e) =>
      e.estado === EstadoEpisodio.ABIERTO || e.estado === EstadoEpisodio.EN_TRATAMIENTO,
  );
  const pastFiltered = filtered.filter(
    (e) =>
      e.estado === EstadoEpisodio.CERRADO || e.estado === EstadoEpisodio.ARCHIVADO,
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const toggleEstado = (estado: EstadoEpisodio) => {
    setFilterEstados((prev) => {
      const next = new Set(prev);
      if (next.has(estado)) next.delete(estado);
      else next.add(estado);
      return next;
    });
  };

  const resetFilters = () => {
    setFilterEstados(new Set(DEFAULT_ESTADOS));
    setFilterProfesional('');
    setFilterSearch('');
    setFilterDesde('');
    setFilterHasta('');
    setFilterSinDx(false);
  };

  const isExpanded = (ep: ClinicalEpisode): boolean => {
    const defaultExpanded =
      ep.estado === EstadoEpisodio.ABIERTO || ep.estado === EstadoEpisodio.EN_TRATAMIENTO;
    return expansionOverrides.has(ep.id)
      ? expansionOverrides.get(ep.id)!
      : defaultExpanded;
  };

  const toggleExpand = (ep: ClinicalEpisode) => {
    setExpansionOverrides((prev) => {
      const next = new Map(prev);
      next.set(ep.id, !isExpanded(ep));
      return next;
    });
  };

  const setAllExpanded = (eps: ClinicalEpisode[], expanded: boolean) => {
    setExpansionOverrides((prev) => {
      const next = new Map(prev);
      eps.forEach((ep) => next.set(ep.id, expanded));
      return next;
    });
  };

  const tarjeteroActivo = tarjetero?.estado === 'activo';
  const canCreateEpisode = canWrite && tarjeteroActivo;
  const isLoading = tarjeteroLoading || episodesLoading;

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box p='20px'>
        <Skeleton h='72px' borderRadius='12px' mb='12px' />
        <Skeleton h='44px' borderRadius='12px' mb='16px' />
        <SkeletonText noOfLines={4} spacing='3' />
      </Box>
    );
  }

  return (
    <Box p='20px'>
      {/* ── Prerequisite warnings ─────────────────────────────────────────── */}
      {!tarjetero && (
        <WarningBanner bg={warningBg} borderColor={warningBorder}>
          Sin tarjetero índice activo. Créalo en el panel izquierdo para habilitar episodios clínicos.
        </WarningBanner>
      )}
      {tarjetero && !tarjeteroActivo && (
        <WarningBanner bg={warningBg} borderColor={warningBorder}>
          Tarjetero {tarjetero.estado} — no se pueden abrir nuevos episodios.
        </WarningBanner>
      )}

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <Box
        bg={filterBg}
        border='1px solid'
        borderColor={filterBorder}
        borderRadius='14px'
        p='14px'
        mb='14px'
      >
        {/* Row 1: estado chips + sinDx */}
        <Flex align='center' gap='6px' mb='10px' flexWrap='wrap'>
          <Flex align='center' gap='4px' mr='2px' flexShrink={0}>
            <Icon as={MdFilterList} w='13px' h='13px' color={mutedColor} />
            <Text
              fontSize='9px'
              fontWeight='800'
              color={mutedColor}
              textTransform='uppercase'
              letterSpacing='0.1em'>
              Estado
            </Text>
          </Flex>
          {(Object.keys(ESTADO_META) as EstadoEpisodio[]).map((estado) => {
            const meta = ESTADO_META[estado];
            const active = filterEstados.has(estado);
            return (
              <Button
                key={estado}
                size='xs'
                colorScheme={meta.colorScheme}
                variant={active ? 'solid' : 'outline'}
                onClick={() => toggleEstado(estado)}
                px='10px'
                h='22px'
                fontSize='10px'
                fontWeight='700'
                flexShrink={0}>
                {meta.label}
              </Button>
            );
          })}
          <Box ml='auto' flexShrink={0}>
            <Checkbox
              size='sm'
              isChecked={filterSinDx}
              onChange={(e) => setFilterSinDx(e.target.checked)}
              colorScheme='orange'>
              <Text fontSize='xs' fontWeight='600' color={mutedColor}>
                Sin diagnóstico
              </Text>
            </Checkbox>
          </Box>
        </Flex>

        {/* Row 2: search + profesional + dates + reset */}
        <Flex gap='8px' flexWrap='wrap' align='center'>
          <InputGroup size='sm' flex='1' minW='150px'>
            <InputLeftElement pointerEvents='none'>
              <Icon as={MdSearch} color={mutedColor} w='14px' h='14px' />
            </InputLeftElement>
            <Input
              placeholder='Buscar motivo, diagnóstico...'
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              bg={bg}
              borderRadius='8px'
              fontSize='xs'
            />
          </InputGroup>
          <Select
            size='sm'
            placeholder='Todos los profesionales'
            value={filterProfesional}
            onChange={(e) => setFilterProfesional(e.target.value)}
            bg={bg}
            borderRadius='8px'
            minW='160px'
            maxW='210px'
            fontSize='xs'>
            {profesionales.map((p) => (
              <option key={p.id} value={p.id}>
                {profesionalNombre(p)}
              </option>
            ))}
          </Select>
          <Input
            size='sm'
            type='date'
            value={filterDesde}
            onChange={(e) => setFilterDesde(e.target.value)}
            bg={bg}
            borderRadius='8px'
            w='130px'
            fontSize='xs'
          />
          <Input
            size='sm'
            type='date'
            value={filterHasta}
            onChange={(e) => setFilterHasta(e.target.value)}
            bg={bg}
            borderRadius='8px'
            w='130px'
            fontSize='xs'
          />
          {hasActiveFilters && (
            <Button
              size='sm'
              variant='ghost'
              onClick={resetFilters}
              fontSize='xs'
              color={mutedColor}
              flexShrink={0}>
              Limpiar
            </Button>
          )}
        </Flex>
      </Box>

      {/* ── Stats + action bar ───────────────────────────────────────────── */}
      <Flex align='center' justify='space-between' mb='16px'>
        <Text fontSize='xs' color={mutedColor} fontWeight='600'>
          {filtered.length === episodes.length
            ? `${episodes.length} episodio${episodes.length !== 1 ? 's' : ''}`
            : `${filtered.length} de ${episodes.length} episodios`}
          {activeFiltered.length > 0 && (
            <Box as='span' color='orange.400' ml='6px'>
              · {activeFiltered.length} activo{activeFiltered.length !== 1 ? 's' : ''}
            </Box>
          )}
        </Text>
        {canCreateEpisode && (
          <Button size='sm' leftIcon={<Icon as={MdAdd} />} onClick={onOpen}>
            Nuevo Episodio
          </Button>
        )}
      </Flex>

      {/* ── Scrollable area: empty state + timeline ──────────────────────── */}
      <Box
        maxH='calc(100vh - 380px)'
        minH='260px'
        overflowY='auto'
        overflowX='hidden'
        pr='2px'
        sx={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { bg: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bg: 'gray.200', borderRadius: '4px' },
        }}>

        {/* Empty state */}
        {filtered.length === 0 && (
          <Flex
            direction='column'
            align='center'
            justify='center'
            bg={emptyBg}
            borderRadius='16px'
            py='40px'
            gap='12px'>
            <Flex
              w='48px'
              h='48px'
              bg='gray.100'
              borderRadius='16px'
              align='center'
              justify='center'>
              <Icon as={MdFolderOff} color='gray.400' w='22px' h='22px' />
            </Flex>
            <Flex direction='column' align='center' gap='4px'>
              <Text fontSize='sm' fontWeight='700' color={textColor}>
                {episodes.length === 0 ? 'Sin episodios clínicos' : 'Sin resultados'}
              </Text>
              <Text fontSize='xs' color={mutedColor} textAlign='center' maxW='260px'>
                {episodes.length === 0
                  ? 'No hay consultas registradas para este paciente'
                  : 'Ajusta los filtros para ver más episodios'}
              </Text>
            </Flex>
            {canCreateEpisode && episodes.length === 0 && (
              <Button size='sm' leftIcon={<Icon as={MdAdd} />} onClick={onOpen}>
                Abrir Episodio
              </Button>
            )}
            {hasActiveFilters && episodes.length > 0 && (
              <Button size='sm' variant='ghost' onClick={resetFilters} color={mutedColor}>
                Limpiar filtros
              </Button>
            )}
          </Flex>
        )}

        {/* Timeline */}
        {filtered.length > 0 && (
          <Box>
            {activeFiltered.length > 0 && (
              <>
                <SectionDivider label={`Episodios Activos · ${activeFiltered.length}`} dotColor='#F6AD55' />
                <TimelineGroup
                  episodes={activeFiltered}
                  isExpanded={isExpanded}
                  toggleExpand={toggleExpand}
                  canWrite={canWrite}
                  isAdmin={isAdmin}
                />
              </>
            )}

            {pastFiltered.length > 0 && (
              <Box mt={activeFiltered.length > 0 ? '24px' : '0'}>
                <SectionDivider
                  label={`Historial · ${pastFiltered.length}`}
                  dotColor='#A0AEC0'>
                  <Flex gap='6px'>
                    <Button
                      size='xs'
                      variant='ghost'
                      fontSize='10px'
                      color={mutedColor}
                      onClick={() => setAllExpanded(pastFiltered, true)}>
                      Expandir todo
                    </Button>
                    <Button
                      size='xs'
                      variant='ghost'
                      fontSize='10px'
                      color={mutedColor}
                      onClick={() => setAllExpanded(pastFiltered, false)}>
                      Colapsar todo
                    </Button>
                  </Flex>
                </SectionDivider>
                <TimelineGroup
                  episodes={pastFiltered}
                  isExpanded={isExpanded}
                  toggleExpand={toggleExpand}
                  canWrite={false}
                  isAdmin={isAdmin}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>

      <EpisodeCreateModal isOpen={isOpen} onClose={onClose} patientId={patient.id} />
    </Box>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WarningBanner({
  bg,
  borderColor,
  children,
}: {
  bg: string;
  borderColor: string;
  children: React.ReactNode;
}) {
  const textColor = useColorModeValue('orange.700', 'orange.200');
  return (
    <Flex
      bg={bg}
      border='1px solid'
      borderColor={borderColor}
      borderRadius='12px'
      px='14px'
      py='10px'
      align='center'
      gap='10px'
      mb='14px'>
      <Icon as={MdWarning} color='orange.400' w='18px' h='18px' flexShrink={0} />
      <Text fontSize='sm' fontWeight='600' color={textColor}>
        {children}
      </Text>
    </Flex>
  );
}

function SectionDivider({
  label,
  dotColor,
  children,
}: {
  label: string;
  dotColor: string;
  children?: React.ReactNode;
}) {
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  return (
    <Flex align='center' gap='8px' mb='14px'>
      <Box w='8px' h='8px' borderRadius='full' bg={dotColor} flexShrink={0} />
      <Text
        fontSize='10px'
        fontWeight='800'
        color={mutedColor}
        textTransform='uppercase'
        letterSpacing='0.1em'
        flexShrink={0}>
        {label}
      </Text>
      <Box flex={1} h='1px' bg={dividerColor} />
      {children}
    </Flex>
  );
}

interface TimelineGroupProps {
  episodes: ClinicalEpisode[];
  isExpanded: (ep: ClinicalEpisode) => boolean;
  toggleExpand: (ep: ClinicalEpisode) => void;
  canWrite: boolean;
  isAdmin: boolean;
}

function TimelineGroup({
  episodes,
  isExpanded,
  toggleExpand,
  canWrite,
  isAdmin,
}: TimelineGroupProps) {
  const bg = useColorModeValue('white', 'navy.800');
  const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const summaryBg = useColorModeValue('white', 'navy.800');
  const summaryHoverBg = useColorModeValue('gray.50', 'navy.750');
  const summaryActiveBg = useColorModeValue('brand.50', 'navy.700');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const timelineLineBg = useColorModeValue('gray.200', 'whiteAlpha.100');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');

  return (
    <Box position='relative' pl='28px'>
      {/* Vertical connecting line */}
      <Box
        position='absolute'
        left='5px'
        top='12px'
        bottom='12px'
        w='2px'
        bg={timelineLineBg}
      />

      {episodes.map((ep, idx) => {
        const meta = ESTADO_META[ep.estado];
        const expanded = isExpanded(ep);
        const isActive =
          ep.estado === EstadoEpisodio.ABIERTO || ep.estado === EstadoEpisodio.EN_TRATAMIENTO;

        return (
          <Box
            key={ep.id}
            position='relative'
            mb={idx < episodes.length - 1 ? '12px' : 0}>
            {/* Timeline dot */}
            <Box
              position='absolute'
              left='-23px'
              top='17px'
              w='14px'
              h='14px'
              borderRadius='full'
              bg={meta.dot}
              border='3px solid'
              borderColor={bg}
              zIndex={2}
            />

            {/* Episode card */}
            <Box
              border='1px solid'
              borderColor={cardBorder}
              borderRadius='14px'
              overflow='hidden'
              transition='box-shadow 0.2s'
              _hover={{ boxShadow: 'sm' }}>
              {/* Summary header — always visible */}
              <Flex
                px='14px'
                py='11px'
                align='flex-start'
                justify='space-between'
                cursor='pointer'
                bg={expanded && isActive ? summaryActiveBg : summaryBg}
                borderLeft='4px solid'
                borderLeftColor={meta.dot}
                _hover={{
                  bg:
                    expanded && isActive ? summaryActiveBg : summaryHoverBg,
                }}
                transition='background 0.15s'
                onClick={() => toggleExpand(ep)}
                role='button'>
                <Flex direction='column' gap='4px' minW={0} flex={1} mr='10px'>
                  <Flex align='center' gap='6px' flexWrap='wrap'>
                    <Badge
                      colorScheme={meta.colorScheme}
                      borderRadius='full'
                      px='8px'
                      py='1px'
                      fontSize='10px'
                      fontWeight='700'
                      flexShrink={0}>
                      {meta.label}
                    </Badge>
                    <Text
                      fontFamily='mono'
                      fontSize='xs'
                      fontWeight='700'
                      color='brand.500'
                      flexShrink={0}>
                      {ep.codigoHc}
                    </Text>
                    <Flex
                      align='center'
                      gap='4px'
                      color={mutedColor}
                      flexShrink={0}>
                      <Icon as={MdCalendarToday} w='11px' h='11px' />
                      <Text fontSize='xs'>{formatFecha(ep.fechaApertura)}</Text>
                      {ep.fechaCierre && (
                        <>
                          <Text fontSize='xs'>→</Text>
                          <Text fontSize='xs'>{formatFecha(ep.fechaCierre)}</Text>
                        </>
                      )}
                    </Flex>
                  </Flex>
                  <Text
                    fontSize='xs'
                    fontWeight='600'
                    color={textColor}
                    noOfLines={1}>
                    {ep.motivoConsulta}
                  </Text>
                </Flex>
                <Icon
                  as={MdChevronRight}
                  color={mutedColor}
                  w='18px'
                  h='18px'
                  flexShrink={0}
                  mt='2px'
                  transform={expanded ? 'rotate(90deg)' : 'rotate(0deg)'}
                  transition='transform 0.2s'
                />
              </Flex>

              {/* Expandable body */}
              <Collapse in={expanded} animateOpacity>
                <Box borderTop='1px solid' borderColor={dividerColor}>
                  <EpisodeActiveCard
                    episode={ep}
                    canWrite={canWrite}
                    isAdmin={isAdmin}
                    headerless
                    noBorder
                  />
                </Box>
                <Box borderTop='1px solid' borderColor={dividerColor}>
                  <EpisodeSoapSection
                    episode={ep}
                    canWrite={canWrite}
                    isAdmin={isAdmin}
                    noBorder
                  />
                </Box>
              </Collapse>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

import {
  Badge,
  Box,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import {
  MdCalendarToday,
  MdChevronRight,
  MdExpandMore,
  MdLocalHospital,
  MdSearch,
  MdSwapVert,
} from 'react-icons/md';
import { ClinicalEpisode, EstadoEpisodio } from 'types/models';

const ESTADO_META: Record<EstadoEpisodio, { label: string; colorScheme: string; dot: string }> = {
  [EstadoEpisodio.ABIERTO]: { label: 'Abierto', colorScheme: 'blue', dot: '#63B3ED' },
  [EstadoEpisodio.EN_TRATAMIENTO]: { label: 'En Tratamiento', colorScheme: 'orange', dot: '#F6AD55' },
  [EstadoEpisodio.CERRADO]: { label: 'Cerrado', colorScheme: 'green', dot: '#68D391' },
  [EstadoEpisodio.ARCHIVADO]: { label: 'Archivado', colorScheme: 'gray', dot: '#A0AEC0' },
};

function formatFecha(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function isActive(e: ClinicalEpisode) {
  return e.estado === EstadoEpisodio.ABIERTO || e.estado === EstadoEpisodio.EN_TRATAMIENTO;
}

function matchesQuery(ep: ClinicalEpisode, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    ep.motivoConsulta.toLowerCase().includes(lower) ||
    (ep.diagnosticoPrincipal?.toLowerCase().includes(lower) ?? false) ||
    (ep.codigoCie10?.toLowerCase().includes(lower) ?? false)
  );
}

// ── Option row ─────────────────────────────────────────────────────────────────

interface OptionRowProps {
  ep: ClinicalEpisode;
  isSelected: boolean;
  onSelect: () => void;
}

function OptionRow({ ep, isSelected, onSelect }: OptionRowProps) {
  const meta = ESTADO_META[ep.estado];
  const rowHoverBg = useColorModeValue('brand.50', 'navy.700');
  const rowSelectedBg = useColorModeValue('brand.50', 'navy.700');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');

  return (
    <Flex
      as='button'
      w='100%'
      align='center'
      gap='10px'
      px='12px'
      py='8px'
      bg={isSelected ? rowSelectedBg : 'transparent'}
      _hover={{ bg: rowHoverBg }}
      cursor='pointer'
      transition='background 0.1s'
      opacity={isActive(ep) ? 1 : 0.7}
      onClick={onSelect}
      textAlign='left'>
      <Box w='8px' h='8px' borderRadius='full' bg={meta.dot} flexShrink={0} mt='1px' />
      <Box flex={1} minW='0'>
        <Flex align='center' gap='6px' mb='1px'>
          <Text fontFamily='mono' fontSize='11px' fontWeight='700' color='brand.500' flexShrink={0}>
            {ep.codigoHc}
          </Text>
          <Badge
            colorScheme={meta.colorScheme}
            variant='subtle'
            borderRadius='full'
            px='6px'
            fontSize='9px'
            fontWeight='700'
            flexShrink={0}>
            {meta.label}
          </Badge>
          <Text fontSize='10px' color={mutedColor} flexShrink={0}>
            {formatFecha(ep.fechaApertura)}
          </Text>
        </Flex>
        <Text fontSize='xs' color={textColor} fontWeight='500' noOfLines={1}>
          {ep.motivoConsulta}
        </Text>
      </Box>
      {isSelected && (
        <Icon as={MdChevronRight} color='brand.500' w='14px' h='14px' flexShrink={0} />
      )}
    </Flex>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  episodes: ClinicalEpisode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function EpisodeContextBar({ episodes, selectedId, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const barBg = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const triggerBg = useColorModeValue('gray.50', 'navy.700');
  const triggerBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const triggerHoverBg = useColorModeValue('gray.100', 'navy.600');
  const dropdownBg = useColorModeValue('white', 'navy.800');
  const dropdownBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const groupLabelColor = useColorModeValue('secondaryGray.400', 'secondaryGray.500');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const dxColor = useColorModeValue('secondaryGray.600', 'secondaryGray.400');
  const emptyColor = useColorModeValue('secondaryGray.400', 'secondaryGray.500');

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setQuery('');
  };

  const selected = episodes.find((e) => e.id === selectedId) ?? null;

  const activeEps = episodes
    .filter(isActive)
    .sort((a, b) => b.fechaApertura.localeCompare(a.fechaApertura));
  const pastEps = episodes
    .filter((e) => !isActive(e))
    .sort((a, b) => b.fechaApertura.localeCompare(a.fechaApertura));

  const trimmed = query.trim();
  const filteredActive = trimmed ? activeEps.filter((e) => matchesQuery(e, trimmed)) : activeEps;
  const filteredPast = trimmed ? pastEps.filter((e) => matchesQuery(e, trimmed)) : pastEps;
  const hasResults = filteredActive.length + filteredPast.length > 0;

  if (episodes.length === 0) return null;

  return (
    <Box
      position='sticky'
      top='0'
      zIndex={2}
      bg={barBg}
      borderBottom='1px solid'
      borderColor={borderColor}
      boxShadow='sm'
      px='16px'
      py='12px'>

      {/* Selector row */}
      <Flex align='center' gap='10px' mb={selected ? '12px' : '0'}>
        <Flex align='center' gap='6px' flexShrink={0}>
          <Icon as={MdSwapVert} w='14px' h='14px' color={mutedColor} />
          <Text fontSize='xs' fontWeight='700' color={mutedColor} whiteSpace='nowrap'>
            Episodio:
          </Text>
        </Flex>

        {/* Trigger + dropdown wrapper — dropdown matches this container width */}
        <Box ref={containerRef} position='relative' flex={1} minW='0'>
          {/* Trigger button */}
          <Flex
            as='button'
            w='100%'
            align='center'
            gap='8px'
            px='12px'
            py='7px'
            bg={isOpen ? triggerHoverBg : triggerBg}
            border='1px solid'
            borderColor={isOpen ? 'brand.400' : triggerBorder}
            borderRadius='10px'
            cursor='pointer'
            transition='all 0.15s'
            _hover={{ bg: triggerHoverBg, borderColor: 'brand.300' }}
            onClick={handleOpen}>
            {selected ? (
              <>
                <Box
                  w='8px' h='8px' borderRadius='full'
                  bg={ESTADO_META[selected.estado].dot}
                  flexShrink={0}
                />
                <Text
                  fontFamily='mono' fontSize='11px' fontWeight='700'
                  color='brand.500' flexShrink={0}>
                  {selected.codigoHc}
                </Text>
                <Text
                  fontSize='sm' fontWeight='600' color={textColor}
                  noOfLines={1} flex={1} minW='0' textAlign='left'>
                  {selected.motivoConsulta}
                </Text>
              </>
            ) : (
              <Text fontSize='sm' color={mutedColor} flex={1} textAlign='left'>
                Seleccionar episodio…
              </Text>
            )}
            <Icon
              as={MdExpandMore}
              w='14px' h='14px' color={mutedColor}
              flexShrink={0}
              transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
              transition='transform 0.2s'
            />
          </Flex>

          {/* Dropdown panel — left/right=0 matches trigger width exactly */}
          {isOpen && (
            <Box
              position='absolute'
              top='calc(100% + 4px)'
              left='0'
              right='0'
              zIndex={10}
              bg={dropdownBg}
              border='1px solid'
              borderColor={dropdownBorder}
              borderRadius='12px'
              boxShadow='lg'
              overflow='hidden'>
              {/* Search input */}
              <Box px='10px' pt='10px' pb='6px'>
                <InputGroup size='sm'>
                  <InputLeftElement pointerEvents='none'>
                    <Icon as={MdSearch} color={mutedColor} w='14px' h='14px' />
                  </InputLeftElement>
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='Buscar por motivo, diagnóstico o CIE-10…'
                    bg={inputBg}
                    border='1px solid'
                    borderColor={inputBorderColor}
                    borderRadius='8px'
                    fontSize='sm'
                    _focus={{ borderColor: 'brand.400', boxShadow: 'none' }}
                    _placeholder={{ color: mutedColor }}
                  />
                </InputGroup>
              </Box>

              {/* Options list */}
              <Box overflowY='auto' maxH='260px'>
                {!hasResults ? (
                  <Flex align='center' justify='center' py='24px'>
                    <Text fontSize='xs' color={emptyColor}>
                      Sin resultados para "{trimmed}"
                    </Text>
                  </Flex>
                ) : (
                  <>
                    {filteredActive.length > 0 && (
                      <Box>
                        <Text
                          px='12px' py='6px'
                          fontSize='10px' fontWeight='800'
                          color={groupLabelColor}
                          textTransform='uppercase' letterSpacing='wider'>
                          Episodios activos
                        </Text>
                        {filteredActive.map((ep) => (
                          <OptionRow
                            key={ep.id}
                            ep={ep}
                            isSelected={ep.id === selectedId}
                            onSelect={() => handleSelect(ep.id)}
                          />
                        ))}
                      </Box>
                    )}
                    {filteredPast.length > 0 && (
                      <Box>
                        <Text
                          px='12px' py='6px'
                          fontSize='10px' fontWeight='800'
                          color={groupLabelColor}
                          textTransform='uppercase' letterSpacing='wider'
                          borderTop={filteredActive.length > 0 ? '1px solid' : 'none'}
                          borderColor={dropdownBorder}>
                          Historial
                        </Text>
                        {filteredPast.map((ep) => (
                          <OptionRow
                            key={ep.id}
                            ep={ep}
                            isSelected={ep.id === selectedId}
                            onSelect={() => handleSelect(ep.id)}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Flex>

      {/* Selected episode info strip */}
      {selected && (
        <Box borderTop='1px solid' borderColor={borderColor} pt='10px'>
          <Flex align='center' gap='8px' flexWrap='wrap' mb='4px'>
            <Box
              w='8px' h='8px' borderRadius='full'
              bg={ESTADO_META[selected.estado].dot} flexShrink={0}
            />
            <Badge
              colorScheme={ESTADO_META[selected.estado].colorScheme}
              borderRadius='full' px='8px' py='1px'
              fontSize='10px' fontWeight='700' flexShrink={0}>
              {ESTADO_META[selected.estado].label}
            </Badge>
            <Text
              fontFamily='mono' fontSize='xs' fontWeight='700'
              color='brand.500' flexShrink={0}>
              {selected.codigoHc}
            </Text>
            <Flex align='center' gap='4px' color={mutedColor} flexShrink={0}>
              <Icon as={MdCalendarToday} w='11px' h='11px' />
              <Text fontSize='xs'>{formatFecha(selected.fechaApertura)}</Text>
            </Flex>
            {selected.fechaCierre && (
              <Text fontSize='xs' color={mutedColor}>
                → {formatFecha(selected.fechaCierre)}
              </Text>
            )}
          </Flex>

          <Text fontSize='sm' fontWeight='600' color={textColor} noOfLines={1} mb='2px'>
            {selected.motivoConsulta}
          </Text>

          {selected.diagnosticoPrincipal && (
            <Flex align='center' gap='5px'>
              <Icon as={MdLocalHospital} w='12px' h='12px' color={dxColor} />
              <Text fontSize='xs' color={dxColor} noOfLines={1}>
                {selected.diagnosticoPrincipal}
                {selected.codigoCie10 && (
                  <Text as='span' fontFamily='mono' fontWeight='700' ml='4px'>
                    ({selected.codigoCie10})
                  </Text>
                )}
              </Text>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}

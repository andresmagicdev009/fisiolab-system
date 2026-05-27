import {
  Badge,
  Box,
  Divider,
  Flex,
  Grid,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import React from 'react';
import { MdCalendarToday, MdEdit, MdNotes } from 'react-icons/md';
import { SoapNote } from 'types/models';
import SoapNoteFormModal from './SoapNoteFormModal';
import { ClinicalEpisode } from 'types/models';

function formatFecha(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function evaColor(eva: number): string {
  if (eva <= 3) return 'green';
  if (eva <= 6) return 'orange';
  return 'red';
}

interface DataRowProps {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}

function DataRow({ label, value, mono }: DataRowProps) {
  const labelColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  if (!value) return null;
  return (
    <Box mb='10px'>
      <Text fontSize='9px' fontWeight='700' color={labelColor} textTransform='uppercase' letterSpacing='0.08em' mb='2px'>
        {label}
      </Text>
      <Text fontSize='sm' color={textColor} fontFamily={mono ? 'mono' : undefined} whiteSpace='pre-wrap' lineHeight='1.6'>
        {value}
      </Text>
    </Box>
  );
}

function SectionHeader({ letter, title, color }: { letter: string; title: string; color: string }) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  return (
    <Flex align='center' gap='8px' mb='12px'>
      <Flex w='22px' h='22px' borderRadius='6px' bg={color} align='center' justify='center' flexShrink={0}>
        <Text fontSize='10px' fontWeight='800' color='white'>{letter}</Text>
      </Flex>
      <Text fontSize='xs' fontWeight='800' color={textColor} textTransform='uppercase' letterSpacing='wider'>
        {title}
      </Text>
    </Flex>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  note: SoapNote;
  episode: ClinicalEpisode;
  canEdit?: boolean;
}

export default function SoapNoteDetailModal({ isOpen, onClose, note, episode, canEdit }: Props) {
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const sectionBg = useColorModeValue('gray.50', 'navy.700');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  const sv = note.objetivo?.signosVitales;
  const hasSignosVitales = sv && Object.values(sv).some((v) => v != null);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size='xl' scrollBehavior='inside'>
        <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
        <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
          <ModalHeader pb='0'>
            <Flex align='center' justify='space-between'>
              <Flex align='center' gap='3'>
                <Flex w='40px' h='40px' bg='brand.500' borderRadius='12px' align='center' justify='center' flexShrink={0}>
                  <Icon as={MdNotes} color='white' w='20px' h='20px' />
                </Flex>
                <Flex direction='column'>
                  <Flex align='center' gap='8px'>
                    <Text color={textColor} fontSize='lg' fontWeight='800'>
                      Sesión #{note.numeroSesion}
                    </Text>
                    {note.subjetivo?.evaDolor != null && (
                      <Badge colorScheme={evaColor(note.subjetivo.evaDolor)} borderRadius='full' px='8px' fontSize='xs' fontWeight='700'>
                        EVA {note.subjetivo.evaDolor}
                      </Badge>
                    )}
                  </Flex>
                  <Flex align='center' gap='6px' color={mutedColor}>
                    <Icon as={MdCalendarToday} w='11px' h='11px' />
                    <Text fontSize='sm' fontWeight='400'>{formatFecha(note.fechaSesion)}</Text>
                    <Text fontSize='sm'>·</Text>
                    <Text fontSize='sm' fontFamily='mono'>{note.codigoHc}</Text>
                  </Flex>
                </Flex>
              </Flex>
              {canEdit && (
                <Button size='sm' variant='outline' leftIcon={<Icon as={MdEdit} />} onClick={onEditOpen} mr='8'>
                  Editar
                </Button>
              )}
            </Flex>
          </ModalHeader>
          <ModalCloseButton top='20px' />

          <ModalBody pt='20px' pb='6'>
            {/* S — Subjetivo */}
            <Box bg={sectionBg} borderRadius='12px' p='14px' mb='12px'>
              <SectionHeader letter='S' title='Subjetivo' color='blue.400' />
              <DataRow label='Motivo de sesión' value={note.subjetivo?.motivoSesion} />
              <DataRow label='Síntomas referidos' value={note.subjetivo?.sintomasReferidos} />
            </Box>

            {/* O — Objetivo */}
            <Box bg={sectionBg} borderRadius='12px' p='14px' mb='12px'>
              <SectionHeader letter='O' title='Objetivo' color='teal.400' />
              {hasSignosVitales && (
                <>
                  <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em' mb='8px'>
                    Signos vitales
                  </Text>
                  <Grid templateColumns='repeat(4, 1fr)' gap='8px' mb='12px'>
                    {sv?.ta && <Box><Text fontSize='9px' color={mutedColor} fontWeight='700'>T/A</Text><Text fontSize='sm' fontWeight='600' color={textColor}>{sv.ta}</Text></Box>}
                    {sv?.fc != null && <Box><Text fontSize='9px' color={mutedColor} fontWeight='700'>FC</Text><Text fontSize='sm' fontWeight='600' color={textColor}>{sv.fc} bpm</Text></Box>}
                    {sv?.fr != null && <Box><Text fontSize='9px' color={mutedColor} fontWeight='700'>FR</Text><Text fontSize='sm' fontWeight='600' color={textColor}>{sv.fr} rpm</Text></Box>}
                    {sv?.temperatura != null && <Box><Text fontSize='9px' color={mutedColor} fontWeight='700'>Temp</Text><Text fontSize='sm' fontWeight='600' color={textColor}>{sv.temperatura}°C</Text></Box>}
                    {sv?.spo2 != null && <Box><Text fontSize='9px' color={mutedColor} fontWeight='700'>SpO₂</Text><Text fontSize='sm' fontWeight='600' color={textColor}>{sv.spo2}%</Text></Box>}
                    {sv?.peso != null && <Box><Text fontSize='9px' color={mutedColor} fontWeight='700'>Peso</Text><Text fontSize='sm' fontWeight='600' color={textColor}>{sv.peso} kg</Text></Box>}
                    {sv?.talla != null && <Box><Text fontSize='9px' color={mutedColor} fontWeight='700'>Talla</Text><Text fontSize='sm' fontWeight='600' color={textColor}>{sv.talla} m</Text></Box>}
                  </Grid>
                  <Divider borderColor={dividerColor} mb='12px' />
                </>
              )}
              <DataRow label='Hallazgos examen físico' value={note.objetivo?.hallazgosExamenFisico} />
              <DataRow label='Rango de movimiento' value={note.objetivo?.rangoMovimiento} />
              <DataRow label='Fuerza muscular' value={note.objetivo?.fuerzaMuscular} />
              <DataRow label='Otros hallazgos' value={note.objetivo?.otrosHallazgos} />
            </Box>

            {/* A — Análisis */}
            <Box bg={sectionBg} borderRadius='12px' p='14px' mb='12px'>
              <SectionHeader letter='A' title='Análisis' color='purple.400' />
              <DataRow label='Diagnóstico fisioterapéutico' value={note.analisis?.diagnosticoFisioterapeutico} />
              <DataRow label='Progreso vs sesión anterior' value={note.analisis?.progresoVsAnterior} />
              <DataRow label='Respuesta al tratamiento' value={note.analisis?.respuestaTratamiento} />
            </Box>

            {/* P — Plan */}
            <Box bg={sectionBg} borderRadius='12px' p='14px' mb='12px'>
              <SectionHeader letter='P' title='Plan' color='green.400' />
              <DataRow label='Técnicas aplicadas' value={note.plan?.tecnicasAplicadas} />
              <DataRow label='Ejercicios indicados' value={note.plan?.ejerciciosIndicados} />
              <DataRow label='Objetivos próxima sesión' value={note.plan?.objetivosProximaSesion} />
              {note.plan?.fechaProximaSesion && (
                <DataRow label='Fecha próxima sesión' value={formatFecha(note.plan.fechaProximaSesion)} />
              )}
            </Box>

            {note.observaciones && (
              <Box bg={sectionBg} borderRadius='12px' p='14px'>
                <DataRow label='Observaciones' value={note.observaciones} />
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant='light' onClick={onClose}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {canEdit && (
        <SoapNoteFormModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          episode={episode}
          editNote={note}
        />
      )}
    </>
  );
}

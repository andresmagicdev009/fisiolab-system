import {
  Badge,
  Box,
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
import { MdCalendarToday, MdEdit, MdScience } from 'react-icons/md';
import { ClinicalEpisode, PhysicalEvaluation } from 'types/models';
import EvaluationFormModal from './EvaluationFormModal';

function formatFecha(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function evaColor(eva: number): string {
  if (eva <= 3) return 'green';
  if (eva <= 6) return 'orange';
  return 'red';
}

function resultadoColor(r: string): string {
  if (r === 'positivo') return 'red';
  if (r === 'negativo') return 'green';
  return 'yellow';
}

interface SectionHeaderProps { title: string; color: string; }
function SectionHeader({ title, color }: SectionHeaderProps) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  return (
    <Flex align='center' gap='8px' mb='12px'>
      <Box w='3px' h='16px' borderRadius='full' bg={color} flexShrink={0} />
      <Text fontSize='xs' fontWeight='800' color={textColor} textTransform='uppercase' letterSpacing='wider'>
        {title}
      </Text>
    </Flex>
  );
}

interface DataRowProps { label: string; value: string | null | undefined; }
function DataRow({ label, value }: DataRowProps) {
  const labelColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  if (!value) return null;
  return (
    <Box mb='10px'>
      <Text fontSize='9px' fontWeight='700' color={labelColor} textTransform='uppercase' letterSpacing='0.08em' mb='2px'>
        {label}
      </Text>
      <Text fontSize='sm' color={textColor} whiteSpace='pre-wrap' lineHeight='1.6'>{value}</Text>
    </Box>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  evaluation: PhysicalEvaluation;
  episode: ClinicalEpisode;
  canEdit?: boolean;
}

export default function EvaluationDetailModal({ isOpen, onClose, evaluation, episode, canEdit }: Props) {
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const sectionBg = useColorModeValue('gray.50', 'navy.700');

  const romEntries = evaluation.rangoMovimiento ? Object.entries(evaluation.rangoMovimiento) : [];
  const fuerzaEntries = evaluation.fuerzaMuscular ? Object.entries(evaluation.fuerzaMuscular) : [];
  const pruebaEntries = evaluation.pruebasEspecificas ? Object.entries(evaluation.pruebasEspecificas) : [];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size='xl' scrollBehavior='inside'>
        <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
        <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
          <ModalHeader pb='0'>
            <Flex align='center' justify='space-between'>
              <Flex align='center' gap='3'>
                <Flex w='40px' h='40px' bg='teal.500' borderRadius='12px' align='center' justify='center' flexShrink={0}>
                  <Icon as={MdScience} color='white' w='20px' h='20px' />
                </Flex>
                <Flex direction='column'>
                  <Flex align='center' gap='8px'>
                    <Text color={textColor} fontSize='lg' fontWeight='800'>
                      Evaluación #{evaluation.numeroEvaluacion}
                    </Text>
                    {evaluation.escalaDolor != null && (
                      <Badge colorScheme={evaColor(evaluation.escalaDolor)} borderRadius='full' px='8px' fontSize='xs' fontWeight='700'>
                        EVA {evaluation.escalaDolor}
                      </Badge>
                    )}
                  </Flex>
                  <Flex align='center' gap='6px' color={mutedColor}>
                    <Icon as={MdCalendarToday} w='11px' h='11px' />
                    <Text fontSize='sm' fontWeight='400'>{formatFecha(evaluation.fechaEvaluacion)}</Text>
                    <Text fontSize='sm'>·</Text>
                    <Text fontSize='sm' fontFamily='mono'>{evaluation.codigoHc}</Text>
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
            {/* Inspección / Palpación */}
            {(evaluation.inspeccion || evaluation.palpacion) && (
              <Box bg={sectionBg} borderRadius='12px' p='14px' mb='12px'>
                <SectionHeader title='Inspección y Palpación' color='teal.400' />
                <DataRow label='Inspección' value={evaluation.inspeccion} />
                <DataRow label='Palpación' value={evaluation.palpacion} />
              </Box>
            )}

            {/* ROM */}
            {romEntries.length > 0 && (
              <Box bg={sectionBg} borderRadius='12px' p='14px' mb='12px'>
                <SectionHeader title='Rango de Movimiento' color='blue.400' />
                <Grid templateColumns='repeat(3, 1fr)' gap='8px'>
                  {romEntries.map(([key, val]) => (
                    <Box key={key}>
                      <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.06em' noOfLines={1}>{key}</Text>
                      <Text fontSize='sm' fontWeight='700' color={textColor}>{val}°</Text>
                    </Box>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Fuerza Muscular */}
            {fuerzaEntries.length > 0 && (
              <Box bg={sectionBg} borderRadius='12px' p='14px' mb='12px'>
                <SectionHeader title='Fuerza Muscular (MRC)' color='purple.400' />
                <Grid templateColumns='repeat(3, 1fr)' gap='8px'>
                  {fuerzaEntries.map(([key, val]) => (
                    <Box key={key}>
                      <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.06em' noOfLines={1}>{key}</Text>
                      <Text fontSize='sm' fontWeight='700' color={textColor}>{val}/5</Text>
                    </Box>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Pruebas Específicas */}
            {pruebaEntries.length > 0 && (
              <Box bg={sectionBg} borderRadius='12px' p='14px' mb='12px'>
                <SectionHeader title='Pruebas Específicas' color='orange.400' />
                <Flex direction='column' gap='8px'>
                  {pruebaEntries.map(([nombre, prueba]) => (
                    <Flex key={nombre} align='center' gap='10px'>
                      <Badge
                        colorScheme={resultadoColor(prueba.resultado)}
                        borderRadius='full'
                        px='8px'
                        py='2px'
                        fontSize='10px'
                        fontWeight='700'
                        flexShrink={0}
                        textTransform='capitalize'>
                        {prueba.resultado}
                      </Badge>
                      <Text fontSize='sm' fontWeight='600' color={textColor}>{nombre}</Text>
                      {prueba.notas && (
                        <Text fontSize='xs' color={mutedColor} fontStyle='italic' noOfLines={1}>{prueba.notas}</Text>
                      )}
                    </Flex>
                  ))}
                </Flex>
              </Box>
            )}

            {/* Diagnóstico y Observaciones */}
            {(evaluation.diagnostico || evaluation.observaciones) && (
              <Box bg={sectionBg} borderRadius='12px' p='14px'>
                <SectionHeader title='Diagnóstico y Observaciones' color='green.400' />
                <DataRow label='Diagnóstico fisioterapéutico' value={evaluation.diagnostico} />
                <DataRow label='Observaciones' value={evaluation.observaciones} />
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant='light' onClick={onClose}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {canEdit && (
        <EvaluationFormModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          episode={episode}
          editEval={evaluation}
        />
      )}
    </>
  );
}

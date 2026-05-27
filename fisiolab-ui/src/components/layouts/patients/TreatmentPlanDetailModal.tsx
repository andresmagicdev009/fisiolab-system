import {
  Badge,
  Box,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Skeleton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import { useCurrentDbUser } from 'hooks/useCurrentUser';
import {
  useCreateExercise,
  useDeleteExercise,
  usePlanDetail,
  useReorderExercises,
  useUpdateExercise,
  useUpdatePlan,
} from 'hooks/usePlans';
import React, { useEffect, useState } from 'react';
import {
  MdAdd,
  MdArrowDownward,
  MdArrowUpward,
  MdCheckCircle,
  MdClose,
  MdDelete,
  MdEdit,
  MdFitnessCenter,
  MdSave,
} from 'react-icons/md';
import {
  ClinicalEpisode,
  CreateExerciseDto,
  EstadoEpisodio,
  EstadoPlan,
  Exercise,
  TreatmentPlan,
  UpdateExerciseDto,
  UpdatePlanDto,
} from 'types/models';
import TreatmentPlanFormModal from './TreatmentPlanFormModal';

function formatFecha(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const ESTADO_CONFIG: Record<EstadoPlan, { colorScheme: string; label: string }> = {
  [EstadoPlan.ACTIVO]: { colorScheme: 'brand', label: 'Activo' },
  [EstadoPlan.COMPLETADO]: { colorScheme: 'green', label: 'Completado' },
  [EstadoPlan.CANCELADO]: { colorScheme: 'gray', label: 'Cancelado' },
};

// ── Exercise row (inline edit) ─────────────────────────────────────────────────

interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  total: number;
  canEdit: boolean;
  patientId: string;
  episodeId: string;
  planId: string;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  isReordering: boolean;
}

function ExerciseRow({
  exercise, index, total, canEdit, patientId, episodeId, planId, onReorder, isReordering,
}: ExerciseRowProps) {
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(exercise.nombre);
  const [descripcion, setDescripcion] = useState(exercise.descripcion ?? '');
  const [series, setSeries] = useState(exercise.series?.toString() ?? '');
  const [repeticiones, setRepeticiones] = useState(exercise.repeticiones?.toString() ?? '');
  const [duracion, setDuracion] = useState(exercise.duracionSegundos?.toString() ?? '');
  const [observaciones, setObservaciones] = useState(exercise.observaciones ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();
  const toast = useToast();

  const bg = useColorModeValue('white', 'navy.800');
  const editBg = useColorModeValue('gray.50', 'navy.750');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('white', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  const handleSave = async () => {
    if (nombre.trim().length < 2) return;
    setIsSaving(true);
    const payload: UpdateExerciseDto = {
      nombre: nombre.trim(),
      ...(descripcion.trim() ? { descripcion: descripcion.trim() } : { descripcion: undefined }),
      ...(series ? { series: Number(series) } : {}),
      ...(repeticiones ? { repeticiones: Number(repeticiones) } : {}),
      ...(duracion ? { duracionSegundos: Number(duracion) } : {}),
      ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
    };
    try {
      await updateExercise.mutateAsync({ patientId, episodeId, planId, exId: exercise.id, payload });
      setEditing(false);
    } catch {
      toast({ title: 'Error al actualizar ejercicio', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExercise.mutateAsync({ patientId, episodeId, planId, exId: exercise.id });
    } catch {
      toast({ title: 'Error al eliminar ejercicio', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
      setIsDeleting(false);
    }
  };

  if (editing) {
    return (
      <Box bg={editBg} border='1px solid' borderColor='brand.200' borderRadius='10px' p='12px' mb='6px'>
        <Flex gap='8px' mb='8px'>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder='Nombre del ejercicio'
            size='sm'
            bg={inputBg}
            border='1px solid' borderColor={inputBorder}
            borderRadius='8px' fontSize='sm'
            _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
          />
          <Flex gap='4px' flexShrink={0}>
            <IconButton
              aria-label='Guardar'
              icon={<Icon as={MdSave} />}
              size='sm'
              colorScheme='brand'
              onClick={handleSave}
              isLoading={isSaving}
              borderRadius='8px'
            />
            <IconButton
              aria-label='Cancelar'
              icon={<Icon as={MdClose} />}
              size='sm'
              variant='ghost'
              onClick={() => setEditing(false)}
              borderRadius='8px'
            />
          </Flex>
        </Flex>
        <Textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder='Descripción (opcional)'
          size='sm' rows={2}
          bg={inputBg} border='1px solid' borderColor={inputBorder}
          borderRadius='8px' fontSize='xs' resize='none' mb='8px'
          _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
        />
        <Flex gap='8px'>
          <Input
            type='number' min={1} max={20}
            value={series} onChange={(e) => setSeries(e.target.value)}
            placeholder='Series'
            size='sm' bg={inputBg} border='1px solid' borderColor={inputBorder}
            borderRadius='8px' fontSize='xs'
            _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
          />
          <Input
            type='number' min={1} max={100}
            value={repeticiones} onChange={(e) => setRepeticiones(e.target.value)}
            placeholder='Reps'
            size='sm' bg={inputBg} border='1px solid' borderColor={inputBorder}
            borderRadius='8px' fontSize='xs'
            _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
          />
          <Input
            type='number' min={1}
            value={duracion} onChange={(e) => setDuracion(e.target.value)}
            placeholder='Duración (seg)'
            size='sm' bg={inputBg} border='1px solid' borderColor={inputBorder}
            borderRadius='8px' fontSize='xs'
            _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
          />
        </Flex>
        <Input
          value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
          placeholder='Observaciones'
          size='sm' mt='8px' bg={inputBg} border='1px solid' borderColor={inputBorder}
          borderRadius='8px' fontSize='xs'
          _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
        />
      </Box>
    );
  }

  return (
    <Flex
      bg={bg}
      border='1px solid'
      borderColor={borderColor}
      borderRadius='10px'
      px='12px'
      py='10px'
      align='center'
      gap='10px'
      mb='6px'>
      <Flex
        w='24px'
        h='24px'
        borderRadius='6px'
        bg='brand.50'
        align='center'
        justify='center'
        flexShrink={0}>
        <Text fontSize='10px' fontWeight='800' color='brand.500'>{exercise.orden}</Text>
      </Flex>

      <Box flex={1} minW='0'>
        <Text fontSize='sm' fontWeight='600' color={textColor} noOfLines={1}>{exercise.nombre}</Text>
        <Flex align='center' gap='8px' mt='2px' flexWrap='wrap'>
          {exercise.series && (
            <Text fontSize='xs' color={mutedColor}>{exercise.series} series</Text>
          )}
          {exercise.repeticiones && (
            <Text fontSize='xs' color={mutedColor}>× {exercise.repeticiones} reps</Text>
          )}
          {exercise.duracionSegundos && (
            <Text fontSize='xs' color={mutedColor}>{exercise.duracionSegundos}s</Text>
          )}
          {exercise.descripcion && (
            <Text fontSize='xs' color={mutedColor} noOfLines={1} maxW='200px'>{exercise.descripcion}</Text>
          )}
        </Flex>
      </Box>

      {canEdit && (
        <Flex gap='2px' flexShrink={0}>
          <Tooltip label='Subir' placement='top'>
            <IconButton
              aria-label='Subir'
              icon={<Icon as={MdArrowUpward} />}
              size='xs'
              variant='ghost'
              isDisabled={index === 0 || isReordering}
              onClick={() => onReorder(exercise.id, 'up')}
            />
          </Tooltip>
          <Tooltip label='Bajar' placement='top'>
            <IconButton
              aria-label='Bajar'
              icon={<Icon as={MdArrowDownward} />}
              size='xs'
              variant='ghost'
              isDisabled={index === total - 1 || isReordering}
              onClick={() => onReorder(exercise.id, 'down')}
            />
          </Tooltip>
          <Tooltip label='Editar' placement='top'>
            <IconButton
              aria-label='Editar'
              icon={<Icon as={MdEdit} />}
              size='xs'
              variant='ghost'
              onClick={() => setEditing(true)}
            />
          </Tooltip>
          <Tooltip label='Eliminar' placement='top'>
            <IconButton
              aria-label='Eliminar'
              icon={<Icon as={MdDelete} />}
              size='xs'
              variant='ghost'
              colorScheme='red'
              isLoading={isDeleting}
              onClick={handleDelete}
            />
          </Tooltip>
        </Flex>
      )}
    </Flex>
  );
}

// ── Add exercise form ──────────────────────────────────────────────────────────

interface AddExerciseFormProps {
  patientId: string;
  episodeId: string;
  planId: string;
  onDone: () => void;
}

function AddExerciseForm({ patientId, episodeId, planId, onDone }: AddExerciseFormProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [series, setSeries] = useState('');
  const [repeticiones, setRepeticiones] = useState('');
  const [duracion, setDuracion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const createExercise = useCreateExercise();
  const toast = useToast();

  const inputBg = useColorModeValue('white', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const formBg = useColorModeValue('brand.50', 'navy.750');

  const handleSave = async () => {
    if (nombre.trim().length < 2) {
      toast({ title: 'Nombre requerido (mín. 2 caracteres)', status: 'warning', duration: 2500, isClosable: true, position: 'top-right' });
      return;
    }
    setIsSaving(true);
    const payload: CreateExerciseDto = {
      nombre: nombre.trim(),
      ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
      ...(series ? { series: Number(series) } : {}),
      ...(repeticiones ? { repeticiones: Number(repeticiones) } : {}),
      ...(duracion ? { duracionSegundos: Number(duracion) } : {}),
      ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
    };
    try {
      await createExercise.mutateAsync({ patientId, episodeId, planId, payload });
      onDone();
    } catch {
      toast({ title: 'Error al agregar ejercicio', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
      setIsSaving(false);
    }
  };

  return (
    <Box bg={formBg} border='1px solid' borderColor='brand.200' borderRadius='10px' p='12px' mt='8px'>
      <Text fontSize='xs' fontWeight='800' color='brand.500' textTransform='uppercase' letterSpacing='wider' mb='8px'>
        Nuevo ejercicio
      </Text>
      <Input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder='Nombre del ejercicio *'
        size='sm' mb='8px'
        bg={inputBg} border='1px solid' borderColor={inputBorder}
        borderRadius='8px' fontSize='sm' color={textColor}
        _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
      />
      <Textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder='Descripción (opcional)'
        size='sm' rows={2} resize='none' mb='8px'
        bg={inputBg} border='1px solid' borderColor={inputBorder}
        borderRadius='8px' fontSize='xs' color={textColor}
        _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
      />
      <Flex gap='8px' mb='8px'>
        <Input
          type='number' min={1} max={20}
          value={series} onChange={(e) => setSeries(e.target.value)}
          placeholder='Series'
          size='sm' bg={inputBg} border='1px solid' borderColor={inputBorder}
          borderRadius='8px' fontSize='xs'
          _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
        />
        <Input
          type='number' min={1} max={100}
          value={repeticiones} onChange={(e) => setRepeticiones(e.target.value)}
          placeholder='Repeticiones'
          size='sm' bg={inputBg} border='1px solid' borderColor={inputBorder}
          borderRadius='8px' fontSize='xs'
          _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
        />
        <Input
          type='number' min={1}
          value={duracion} onChange={(e) => setDuracion(e.target.value)}
          placeholder='Duración (seg)'
          size='sm' bg={inputBg} border='1px solid' borderColor={inputBorder}
          borderRadius='8px' fontSize='xs'
          _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
        />
      </Flex>
      <Input
        value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
        placeholder='Observaciones'
        size='sm' mb='10px'
        bg={inputBg} border='1px solid' borderColor={inputBorder}
        borderRadius='8px' fontSize='xs'
        _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
      />
      <Flex gap='8px' justify='flex-end'>
        <Button size='sm' variant='light' onClick={onDone}>Cancelar</Button>
        <Button size='sm' isLoading={isSaving} leftIcon={<Icon as={MdAdd} />} onClick={handleSave}>
          Agregar
        </Button>
      </Flex>
    </Box>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plan: TreatmentPlan;
  episode: ClinicalEpisode;
  canEdit: boolean;
}

export default function TreatmentPlanDetailModal({ isOpen, onClose, plan, episode, canEdit }: Props) {
  const toast = useToast();
  const { data: currentUser } = useCurrentDbUser();
  const updatePlan = useUpdatePlan();
  const reorderExercises = useReorderExercises();

  const episodeActive =
    episode.estado === EstadoEpisodio.ABIERTO || episode.estado === EstadoEpisodio.EN_TRATAMIENTO;
  const planActive = plan.estado === EstadoPlan.ACTIVO;
  const canMutate = canEdit && episodeActive && planActive;

  const { data: detail, isLoading } = usePlanDetail(
    episode.pacienteId,
    episode.id,
    isOpen ? plan.id : null,
  );

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [progreso, setProgreso] = useState(plan.progresoPorcentaje);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProgreso(plan.progresoPorcentaje);
      setShowAddExercise(false);
    }
  }, [isOpen, plan.progresoPorcentaje]);

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const noteColor = useColorModeValue('secondaryGray.700', 'secondaryGray.300');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const headerBg = useColorModeValue('brand.50', 'navy.700');
  const sectionColor = useColorModeValue('brand.500', 'brand.400');

  const cfg = ESTADO_CONFIG[plan.estado];
  const exercises = detail?.exercises ?? [];

  const transition = async (estado: EstadoPlan.COMPLETADO | EstadoPlan.CANCELADO) => {
    setIsTransitioning(true);
    try {
      const payload: UpdatePlanDto = { estado };
      await updatePlan.mutateAsync({ patientId: episode.pacienteId, episodeId: episode.id, planId: plan.id, payload });
      const msg = estado === EstadoPlan.COMPLETADO ? 'Plan completado' : 'Plan cancelado';
      toast({ title: msg, status: 'success', duration: 2500, isClosable: true, position: 'top-right' });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Intente nuevamente', status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
    } finally {
      setIsTransitioning(false);
    }
  };

  const saveProgress = async () => {
    setIsSavingProgress(true);
    try {
      await updatePlan.mutateAsync({
        patientId: episode.pacienteId, episodeId: episode.id, planId: plan.id,
        payload: { progresoPorcentaje: progreso },
      });
      toast({ title: `Progreso actualizado: ${progreso}%`, status: 'success', duration: 2000, isClosable: true, position: 'top-right' });
    } catch {
      toast({ title: 'Error al guardar progreso', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...exercises].sort((a, b) => a.orden - b.orden);
    const idx = sorted.findIndex((e) => e.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newOrder = sorted.map((ex, i) => {
      if (i === idx) return { id: ex.id, orden: sorted[swapIdx].orden };
      if (i === swapIdx) return { id: ex.id, orden: sorted[idx].orden };
      return { id: ex.id, orden: ex.orden };
    });

    setIsReordering(true);
    try {
      await reorderExercises.mutateAsync({
        patientId: episode.pacienteId, episodeId: episode.id, planId: plan.id,
        payload: { orden: newOrder },
      });
    } catch {
      toast({ title: 'Error al reordenar', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
    } finally {
      setIsReordering(false);
    }
  };

  const sortedExercises = [...exercises].sort((a, b) => a.orden - b.orden);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size='xl' scrollBehavior='inside'>
        <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
        <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
          <Progress
            value={plan.progresoPorcentaje}
            size='xs'
            colorScheme='brand'
            borderTopLeftRadius='20px'
            borderTopRightRadius='20px'
          />
          <ModalHeader pb='0' pt='16px'>
            <Flex bg={headerBg} borderRadius='12px' px='14px' py='12px' align='center' justify='space-between' flexWrap='wrap' gap='8px'>
              <Flex align='center' gap='10px'>
                <Flex w='36px' h='36px' borderRadius='10px' bg='brand.500' align='center' justify='center' flexShrink={0} direction='column'>
                  <Icon as={MdFitnessCenter} color='white' w='14px' h='14px' />
                  <Text fontSize='9px' fontWeight='800' color='white' lineHeight='1.2'>#{plan.numeroPlan}</Text>
                </Flex>
                <Flex direction='column'>
                  <Flex align='center' gap='8px'>
                    <Badge colorScheme={cfg.colorScheme} borderRadius='full' px='8px' fontSize='xs' fontWeight='700'>
                      {cfg.label}
                    </Badge>
                    <Text fontFamily='mono' fontSize='xs' fontWeight='700' color='brand.500'>{plan.codigoHc}</Text>
                  </Flex>
                  <Text fontSize='xs' color={mutedColor}>Plan #{plan.numeroPlan}</Text>
                </Flex>
              </Flex>
              <Flex align='center' gap='6px'>
                {canMutate && (
                  <Button size='sm' variant='outline' leftIcon={<Icon as={MdEdit} />} onClick={onEditOpen}>
                    Editar
                  </Button>
                )}
                {canMutate && (
                  <Button size='sm' colorScheme='green' leftIcon={<Icon as={MdCheckCircle} />} isLoading={isTransitioning} onClick={() => transition(EstadoPlan.COMPLETADO)}>
                    Completar
                  </Button>
                )}
                {canMutate && (
                  <Button size='sm' colorScheme='red' variant='outline' isLoading={isTransitioning} onClick={() => transition(EstadoPlan.CANCELADO)}>
                    Cancelar plan
                  </Button>
                )}
              </Flex>
            </Flex>
          </ModalHeader>
          <ModalCloseButton top='20px' />

          <ModalBody pt='20px' pb='6'>
            {/* Objetivo */}
            <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em' mb='4px'>
              Objetivo Terapéutico
            </Text>
            <Text fontSize='sm' fontWeight='600' color={textColor} mb='16px' lineHeight='1.6'>
              {plan.objetivoTerapeutico}
            </Text>

            {/* Parámetros */}
            <Flex gap='20px' flexWrap='wrap' mb='16px'>
              {plan.duracionEstimadaSemanas && (
                <Flex direction='column' gap='1px'>
                  <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em'>Duración</Text>
                  <Text fontSize='sm' fontWeight='600' color={textColor}>{plan.duracionEstimadaSemanas} semanas</Text>
                </Flex>
              )}
              {plan.frecuenciaSemanal && (
                <Flex direction='column' gap='1px'>
                  <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em'>Frecuencia</Text>
                  <Text fontSize='sm' fontWeight='600' color={textColor}>{plan.frecuenciaSemanal} ses/semana</Text>
                </Flex>
              )}
              {plan.fechaInicio && (
                <Flex direction='column' gap='1px'>
                  <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em'>Fecha inicio</Text>
                  <Text fontSize='sm' fontWeight='600' color={textColor}>{formatFecha(plan.fechaInicio)}</Text>
                </Flex>
              )}
              {plan.fechaFin && (
                <Flex direction='column' gap='1px'>
                  <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em'>Fecha fin</Text>
                  <Text fontSize='sm' fontWeight='600' color={textColor}>{formatFecha(plan.fechaFin)}</Text>
                </Flex>
              )}
            </Flex>

            {plan.observaciones && (
              <>
                <Divider borderColor={dividerColor} mb='16px' />
                <Text fontSize='9px' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='0.08em' mb='4px'>
                  Observaciones
                </Text>
                <Text fontSize='xs' color={noteColor} lineHeight='1.6' mb='16px'>{plan.observaciones}</Text>
              </>
            )}

            {/* Progreso slider */}
            <Divider borderColor={dividerColor} mb='16px' />
            <Flex align='center' justify='space-between' mb='8px'>
              <Text fontSize='xs' fontWeight='800' color={sectionColor} textTransform='uppercase' letterSpacing='wider'>
                Progreso — {progreso}%
              </Text>
              {canMutate && progreso !== plan.progresoPorcentaje && (
                <Button size='xs' isLoading={isSavingProgress} onClick={saveProgress}>
                  Guardar
                </Button>
              )}
            </Flex>
            <Slider
              value={progreso}
              onChange={canMutate ? setProgreso : undefined}
              min={0} max={100} step={5}
              colorScheme='brand'
              isReadOnly={!canMutate}
              mb='20px'>
              <SliderTrack bg={useColorModeValue('gray.100', 'navy.600')} borderRadius='full'>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={canMutate ? 5 : 3} />
            </Slider>

            {/* Ejercicios */}
            <Divider borderColor={dividerColor} mb='16px' />
            <Flex align='center' justify='space-between' mb='12px'>
              <Text fontSize='xs' fontWeight='800' color={sectionColor} textTransform='uppercase' letterSpacing='wider'>
                Ejercicios ({isLoading ? '…' : exercises.length})
              </Text>
              {canMutate && !showAddExercise && (
                <Button size='xs' leftIcon={<Icon as={MdAdd} />} onClick={() => setShowAddExercise(true)}>
                  Agregar
                </Button>
              )}
            </Flex>

            {isLoading ? (
              <Flex direction='column' gap='6px'>
                <Skeleton h='48px' borderRadius='10px' />
                <Skeleton h='48px' borderRadius='10px' />
              </Flex>
            ) : sortedExercises.length === 0 && !showAddExercise ? (
              <Flex direction='column' align='center' py='16px' gap='6px'>
                <Icon as={MdFitnessCenter} color={mutedColor} w='20px' h='20px' />
                <Text fontSize='xs' color={mutedColor}>
                  {canMutate ? 'Sin ejercicios — agrega el primero' : 'Sin ejercicios registrados'}
                </Text>
                {canMutate && (
                  <Button size='xs' leftIcon={<Icon as={MdAdd} />} mt='4px' onClick={() => setShowAddExercise(true)}>
                    Agregar ejercicio
                  </Button>
                )}
              </Flex>
            ) : (
              <>
                {sortedExercises.map((ex, idx) => (
                  <ExerciseRow
                    key={ex.id}
                    exercise={ex}
                    index={idx}
                    total={sortedExercises.length}
                    canEdit={canMutate}
                    patientId={episode.pacienteId}
                    episodeId={episode.id}
                    planId={plan.id}
                    onReorder={handleReorder}
                    isReordering={isReordering}
                  />
                ))}
              </>
            )}

            {showAddExercise && (
              <AddExerciseForm
                patientId={episode.pacienteId}
                episodeId={episode.id}
                planId={plan.id}
                onDone={() => setShowAddExercise(false)}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {canMutate && (
        <TreatmentPlanFormModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          episode={episode}
          plan={plan}
        />
      )}
    </>
  );
}

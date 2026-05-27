import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import { useCurrentDbUser } from 'hooks/useCurrentUser';
import { useCreateEvaluation, useUpdateEvaluation } from 'hooks/useEvaluations';
import React, { useEffect, useState } from 'react';
import {
  MdAdd,
  MdClose,
  MdFitnessCenter,
  MdScience,
  MdStraighten,
} from 'react-icons/md';
import { ClinicalEpisode, PhysicalEvaluation } from 'types/models';

const TODAY = new Date().toISOString().split('T')[0];

interface KVRow { key: string; value: string; }
interface PruebaRow { nombre: string; resultado: 'positivo' | 'negativo' | 'dudoso'; notas: string; }

function recordToRows(rec: Record<string, number> | null): KVRow[] {
  if (!rec || Object.keys(rec).length === 0) return [{ key: '', value: '' }];
  return Object.entries(rec).map(([key, value]) => ({ key, value: String(value) }));
}

function pruebasToRows(rec: Record<string, { resultado: string; notas?: string }> | null): PruebaRow[] {
  if (!rec || Object.keys(rec).length === 0) return [];
  return Object.entries(rec).map(([nombre, p]) => ({
    nombre,
    resultado: p.resultado as PruebaRow['resultado'],
    notas: p.notas ?? '',
  }));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  episode: ClinicalEpisode;
  editEval?: PhysicalEvaluation;
}

export default function EvaluationFormModal({ isOpen, onClose, episode, editEval }: Props) {
  const toast = useToast();
  const { data: currentUser } = useCurrentDbUser();
  const createEval = useCreateEvaluation();
  const updateEval = useUpdateEvaluation();
  const isEdit = !!editEval;

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const accordionBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const headerBg = useColorModeValue('gray.50', 'navy.700');
  const rowBg = useColorModeValue('gray.50', 'navy.750');
  const rowBorder = useColorModeValue('gray.200', 'whiteAlpha.150');

  const [fechaEvaluacion, setFechaEvaluacion] = useState(TODAY);
  const [escalaDolor, setEscalaDolor] = useState('');
  const [inspeccion, setInspeccion] = useState('');
  const [palpacion, setPalpacion] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [romRows, setRomRows] = useState<KVRow[]>([{ key: '', value: '' }]);
  const [fuerzaRows, setFuerzaRows] = useState<KVRow[]>([{ key: '', value: '' }]);
  const [pruebaRows, setPruebaRows] = useState<PruebaRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && editEval) {
      setFechaEvaluacion(editEval.fechaEvaluacion);
      setEscalaDolor(editEval.escalaDolor != null ? String(editEval.escalaDolor) : '');
      setInspeccion(editEval.inspeccion ?? '');
      setPalpacion(editEval.palpacion ?? '');
      setDiagnostico(editEval.diagnostico ?? '');
      setObservaciones(editEval.observaciones ?? '');
      setRomRows(recordToRows(editEval.rangoMovimiento));
      setFuerzaRows(recordToRows(editEval.fuerzaMuscular));
      setPruebaRows(pruebasToRows(editEval.pruebasEspecificas));
    } else {
      setFechaEvaluacion(TODAY);
      setEscalaDolor('');
      setInspeccion('');
      setPalpacion('');
      setDiagnostico('');
      setObservaciones('');
      setRomRows([{ key: '', value: '' }]);
      setFuerzaRows([{ key: '', value: '' }]);
      setPruebaRows([]);
    }
    setErrors({});
  }, [isOpen, editEval, isEdit]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fechaEvaluacion) e.fecha = 'Requerido';
    if (fechaEvaluacion > TODAY) e.fecha = 'No puede ser fecha futura';
    if (escalaDolor !== '' && (Number(escalaDolor) < 0 || Number(escalaDolor) > 10))
      e.escalaDolor = 'Valor entre 0 y 10';
    romRows.forEach((r, i) => {
      if (r.key.trim() && (isNaN(Number(r.value)) || r.value.trim() === ''))
        e[`rom_${i}`] = 'Número requerido';
    });
    fuerzaRows.forEach((r, i) => {
      if (r.key.trim() && (isNaN(Number(r.value)) || r.value.trim() === ''))
        e[`fuerza_${i}`] = 'Número requerido';
      if (r.key.trim() && r.value.trim() && (Number(r.value) < 0 || Number(r.value) > 5))
        e[`fuerza_${i}`] = 'MRC: 0–5';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    const rangoMovimiento = romRows
      .filter((r) => r.key.trim() && r.value.trim() && !isNaN(Number(r.value)))
      .reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.key.trim()]: Number(r.value) }), {});

    const fuerzaMuscular = fuerzaRows
      .filter((r) => r.key.trim() && r.value.trim() && !isNaN(Number(r.value)))
      .reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.key.trim()]: Number(r.value) }), {});

    const pruebasEspecificas = pruebaRows
      .filter((r) => r.nombre.trim())
      .reduce<Record<string, { resultado: 'positivo' | 'negativo' | 'dudoso'; notas?: string }>>((acc, r) => ({
        ...acc,
        [r.nombre.trim()]: {
          resultado: r.resultado,
          ...(r.notas.trim() ? { notas: r.notas.trim() } : {}),
        },
      }), {});

    return {
      fechaEvaluacion,
      profesionalId: currentUser!.id,
      ...(escalaDolor !== '' ? { escalaDolor: Number(escalaDolor) } : {}),
      ...(Object.keys(rangoMovimiento).length ? { rangoMovimiento } : {}),
      ...(Object.keys(fuerzaMuscular).length ? { fuerzaMuscular } : {}),
      ...(Object.keys(pruebasEspecificas).length ? { pruebasEspecificas } : {}),
      ...(inspeccion.trim() ? { inspeccion: inspeccion.trim() } : {}),
      ...(palpacion.trim() ? { palpacion: palpacion.trim() } : {}),
      ...(diagnostico.trim() ? { diagnostico: diagnostico.trim() } : {}),
      ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!currentUser?.id) {
      toast({ title: 'Sin sesión de usuario', status: 'error', duration: 3000, position: 'top-right', isClosable: true });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit && editEval) {
        const { profesionalId, ...updatePayload } = payload;
        await updateEval.mutateAsync({
          patientId: episode.pacienteId,
          episodeId: episode.id,
          evalId: editEval.id,
          payload: updatePayload,
        });
        toast({ title: `Evaluación #${editEval.numeroEvaluacion} actualizada`, status: 'success', duration: 2500, isClosable: true, position: 'top-right' });
      } else {
        await createEval.mutateAsync({
          patientId: episode.pacienteId,
          episodeId: episode.id,
          payload,
        });
        toast({ title: 'Evaluación registrada', status: 'success', duration: 2500, isClosable: true, position: 'top-right' });
      }
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 422 ? 'El episodio está cerrado o archivado' :
        status === 403 ? 'Solo el autor o admin puede editar' :
        status === 400 ? (err?.response?.data?.message ?? 'Fecha futura no permitida') :
        err?.response?.data?.message ?? 'Error al guardar';
      toast({ title: 'Error', description: msg, status: 'error', duration: 5000, isClosable: true, position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Dynamic KV list helpers ──
  const updateKV = (
    rows: KVRow[],
    setRows: React.Dispatch<React.SetStateAction<KVRow[]>>,
    idx: number,
    field: 'key' | 'value',
    val: string,
  ) => setRows(rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));

  const addKVRow = (setRows: React.Dispatch<React.SetStateAction<KVRow[]>>) =>
    setRows((rows) => [...rows, { key: '', value: '' }]);

  const removeKVRow = (
    rows: KVRow[],
    setRows: React.Dispatch<React.SetStateAction<KVRow[]>>,
    idx: number,
  ) => {
    if (rows.length === 1) return setRows([{ key: '', value: '' }]);
    setRows(rows.filter((_, i) => i !== idx));
  };

  const SectionLabel = ({ icon, title, color }: { icon: any; title: string; color: string }) => (
    <Flex align='center' gap='8px'>
      <Flex w='24px' h='24px' borderRadius='6px' bg={color} align='center' justify='center' flexShrink={0}>
        <Icon as={icon} color='white' w='14px' h='14px' />
      </Flex>
      <Text fontWeight='700' color={textColor} fontSize='sm'>{title}</Text>
    </Flex>
  );

  const TA = ({ label, value, onChange, placeholder, rows = 2, maxLen }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; rows?: number; maxLen?: number;
  }) => (
    <FormControl mb='14px'>
      <FormLabel ms='2px' fontSize='xs' fontWeight='700' color={mutedColor} mb='4px'>{label}</FormLabel>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        bg={inputBg}
        border='1px solid'
        borderColor={inputBorder}
        borderRadius='12px'
        fontSize='sm'
        resize='vertical'
        maxLength={maxLen}
        _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
      />
    </FormControl>
  );

  const KVSection = ({
    label, unit, rows, setRows, prefix, valuePlaceholder, valueMax,
  }: {
    label: string; unit: string; rows: KVRow[];
    setRows: React.Dispatch<React.SetStateAction<KVRow[]>>;
    prefix: string; valuePlaceholder: string; valueMax?: number;
  }) => (
    <Box mb='14px'>
      <Text fontSize='xs' fontWeight='700' color={mutedColor} mb='8px'>{label}</Text>
      <Flex direction='column' gap='6px'>
        {rows.map((row, i) => (
          <Flex key={i} gap='8px' align='flex-start'>
            <Input
              value={row.key}
              onChange={(e) => updateKV(rows, setRows, i, 'key', e.target.value)}
              placeholder='Ej: hombroFlexionD'
              bg={rowBg}
              border='1px solid'
              borderColor={rowBorder}
              borderRadius='10px'
              fontSize='sm'
              flex={2}
              _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
            />
            <FormControl isInvalid={!!errors[`${prefix}_${i}`]} flex={1}>
              <Input
                value={row.value}
                onChange={(e) => updateKV(rows, setRows, i, 'value', e.target.value)}
                placeholder={valuePlaceholder}
                type='number'
                max={valueMax}
                min={0}
                bg={rowBg}
                border='1px solid'
                borderColor={errors[`${prefix}_${i}`] ? 'red.400' : rowBorder}
                borderRadius='10px'
                fontSize='sm'
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
              />
              {errors[`${prefix}_${i}`] && (
                <FormErrorMessage fontSize='10px' ms='4px'>{errors[`${prefix}_${i}`]}</FormErrorMessage>
              )}
            </FormControl>
            <Text fontSize='xs' color={mutedColor} mt='10px' flexShrink={0}>{unit}</Text>
            <IconButton
              aria-label='Eliminar'
              icon={<Icon as={MdClose} />}
              size='sm'
              variant='ghost'
              colorScheme='gray'
              onClick={() => removeKVRow(rows, setRows, i)}
            />
          </Flex>
        ))}
        <Button size='xs' variant='ghost' leftIcon={<Icon as={MdAdd} />} onClick={() => addKVRow(setRows)} alignSelf='flex-start'>
          Añadir {label.toLowerCase()}
        </Button>
      </Flex>
    </Box>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='xl' scrollBehavior='inside'>
      <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
      <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
        <ModalHeader pb='0'>
          <Flex align='center' gap='3'>
            <Flex w='40px' h='40px' bg='teal.500' borderRadius='12px' align='center' justify='center' flexShrink={0}>
              <Icon as={MdScience} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>
                {isEdit ? `Editar Evaluación #${editEval?.numeroEvaluacion}` : 'Nueva Evaluación Física'}
              </Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {episode.codigoHc}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='4'>
          <form id='eval-form' onSubmit={handleSubmit}>
            {/* Fecha + EVA */}
            <Flex gap='16px' mb='16px'>
              <FormControl isInvalid={!!errors.fecha} flex={1}>
                <FormLabel ms='2px' fontSize='xs' fontWeight='700' color={mutedColor} mb='4px'>
                  Fecha de evaluación *
                </FormLabel>
                <Input
                  type='date'
                  value={fechaEvaluacion}
                  onChange={(e) => { setFechaEvaluacion(e.target.value); setErrors((er) => ({ ...er, fecha: '' })); }}
                  max={TODAY}
                  bg={inputBg}
                  border='1px solid'
                  borderColor={errors.fecha ? 'red.400' : inputBorder}
                  borderRadius='12px'
                  fontSize='sm'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                />
                {errors.fecha && <FormErrorMessage ms='4px'>{errors.fecha}</FormErrorMessage>}
              </FormControl>
              <FormControl isInvalid={!!errors.escalaDolor} w='130px' flexShrink={0}>
                <FormLabel ms='2px' fontSize='xs' fontWeight='700' color={mutedColor} mb='4px'>
                  EVA Dolor (0–10)
                </FormLabel>
                <Input
                  type='number'
                  min={0}
                  max={10}
                  value={escalaDolor}
                  onChange={(e) => { setEscalaDolor(e.target.value); setErrors((er) => ({ ...er, escalaDolor: '' })); }}
                  placeholder='0'
                  bg={inputBg}
                  border='1px solid'
                  borderColor={errors.escalaDolor ? 'red.400' : inputBorder}
                  borderRadius='12px'
                  fontSize='sm'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                />
                {errors.escalaDolor && <FormErrorMessage ms='4px'>{errors.escalaDolor}</FormErrorMessage>}
              </FormControl>
            </Flex>

            <Accordion allowMultiple defaultIndex={[0, 1]} borderColor={accordionBorder}>
              {/* Inspección / Palpación */}
              <AccordionItem border='1px solid' borderColor={accordionBorder} borderRadius='12px' mb='8px' overflow='hidden'>
                <AccordionButton px='14px' py='12px' bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
                  <Box flex={1} textAlign='left'>
                    <SectionLabel icon={MdScience} title='Inspección y Palpación' color='teal.400' />
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px='14px' pt='14px' pb='4px'>
                  <TA label='Inspección' value={inspeccion} onChange={setInspeccion} placeholder='Postura, marcha, actitud antálgica...' rows={3} maxLen={2000} />
                  <TA label='Palpación' value={palpacion} onChange={setPalpacion} placeholder='Puntos gatillo, tensión muscular, temperatura...' rows={3} maxLen={2000} />
                </AccordionPanel>
              </AccordionItem>

              {/* ROM */}
              <AccordionItem border='1px solid' borderColor={accordionBorder} borderRadius='12px' mb='8px' overflow='hidden'>
                <AccordionButton px='14px' py='12px' bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
                  <Box flex={1} textAlign='left'>
                    <SectionLabel icon={MdStraighten} title='Rango de Movimiento (ROM)' color='blue.400' />
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px='14px' pt='14px' pb='4px'>
                  <Text fontSize='xs' color={mutedColor} mb='10px'>
                    Clave: segmento + movimiento + lado. Ej: <Text as='span' fontFamily='mono'>hombroFlexionD</Text>
                  </Text>
                  <KVSection
                    label='Mediciones ROM'
                    unit='°'
                    rows={romRows}
                    setRows={setRomRows}
                    prefix='rom'
                    valuePlaceholder='90'
                  />
                </AccordionPanel>
              </AccordionItem>

              {/* Fuerza Muscular */}
              <AccordionItem border='1px solid' borderColor={accordionBorder} borderRadius='12px' mb='8px' overflow='hidden'>
                <AccordionButton px='14px' py='12px' bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
                  <Box flex={1} textAlign='left'>
                    <SectionLabel icon={MdFitnessCenter} title='Fuerza Muscular (Escala MRC)' color='purple.400' />
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px='14px' pt='14px' pb='4px'>
                  <Text fontSize='xs' color={mutedColor} mb='10px'>
                    Escala MRC 0–5. Clave: músculo + lado. Ej: <Text as='span' fontFamily='mono'>deltoidesD</Text>
                  </Text>
                  <KVSection
                    label='Músculo'
                    unit='/ 5'
                    rows={fuerzaRows}
                    setRows={setFuerzaRows}
                    prefix='fuerza'
                    valuePlaceholder='4'
                    valueMax={5}
                  />
                </AccordionPanel>
              </AccordionItem>

              {/* Pruebas Específicas */}
              <AccordionItem border='1px solid' borderColor={accordionBorder} borderRadius='12px' mb='8px' overflow='hidden'>
                <AccordionButton px='14px' py='12px' bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
                  <Box flex={1} textAlign='left'>
                    <SectionLabel icon={MdScience} title='Pruebas Específicas' color='orange.400' />
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px='14px' pt='14px' pb='4px'>
                  <Flex direction='column' gap='8px' mb='8px'>
                    {pruebaRows.map((row, i) => (
                      <Flex key={i} gap='8px' align='flex-start' bg={rowBg} p='10px' borderRadius='10px' border='1px solid' borderColor={rowBorder}>
                        <Input
                          value={row.nombre}
                          onChange={(e) => setPruebaRows(pruebaRows.map((r, j) => j === i ? { ...r, nombre: e.target.value } : r))}
                          placeholder='Ej: Neer, Hawkins, Lasègue'
                          bg='transparent'
                          border='none'
                          borderBottom='1px solid'
                          borderColor={inputBorder}
                          borderRadius='0'
                          fontSize='sm'
                          fontWeight='600'
                          flex={2}
                          _focus={{ boxShadow: 'none', borderColor: 'brand.500' }}
                        />
                        <Select
                          value={row.resultado}
                          onChange={(e) => setPruebaRows(pruebaRows.map((r, j) => j === i ? { ...r, resultado: e.target.value as PruebaRow['resultado'] } : r))}
                          bg={inputBg}
                          border='1px solid'
                          borderColor={inputBorder}
                          borderRadius='10px'
                          fontSize='sm'
                          flex={1}
                          _focus={{ boxShadow: 'none' }}>
                          <option value='positivo'>Positivo</option>
                          <option value='negativo'>Negativo</option>
                          <option value='dudoso'>Dudoso</option>
                        </Select>
                        <IconButton
                          aria-label='Eliminar'
                          icon={<Icon as={MdClose} />}
                          size='sm'
                          variant='ghost'
                          onClick={() => setPruebaRows(pruebaRows.filter((_, j) => j !== i))}
                        />
                        <Input
                          value={row.notas}
                          onChange={(e) => setPruebaRows(pruebaRows.map((r, j) => j === i ? { ...r, notas: e.target.value } : r))}
                          placeholder='Notas opcionales'
                          bg='transparent'
                          border='none'
                          borderBottom='1px solid'
                          borderColor={inputBorder}
                          borderRadius='0'
                          fontSize='xs'
                          flex={2}
                          maxLength={200}
                          _focus={{ boxShadow: 'none', borderColor: 'brand.500' }}
                        />
                      </Flex>
                    ))}
                  </Flex>
                  <Button
                    size='xs'
                    variant='ghost'
                    leftIcon={<Icon as={MdAdd} />}
                    onClick={() => setPruebaRows([...pruebaRows, { nombre: '', resultado: 'negativo', notas: '' }])}>
                    Añadir prueba
                  </Button>
                </AccordionPanel>
              </AccordionItem>

              {/* Diagnóstico */}
              <AccordionItem border='1px solid' borderColor={accordionBorder} borderRadius='12px' mb='8px' overflow='hidden'>
                <AccordionButton px='14px' py='12px' bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
                  <Box flex={1} textAlign='left'>
                    <SectionLabel icon={MdScience} title='Diagnóstico y Observaciones' color='green.400' />
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px='14px' pt='14px' pb='4px'>
                  <TA label='Diagnóstico fisioterapéutico' value={diagnostico} onChange={setDiagnostico} placeholder='Diagnóstico basado en hallazgos de la evaluación...' rows={2} maxLen={1000} />
                  <TA label='Observaciones' value={observaciones} onChange={setObservaciones} placeholder='Notas adicionales...' rows={2} maxLen={1000} />
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>Cancelar</Button>
          <Button
            type='submit'
            form='eval-form'
            isLoading={isSubmitting}
            colorScheme='teal'
            leftIcon={<Icon as={MdScience} />}>
            {isEdit ? 'Guardar cambios' : 'Registrar evaluación'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

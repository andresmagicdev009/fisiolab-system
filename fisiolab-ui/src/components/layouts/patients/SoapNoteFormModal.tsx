import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import { useCurrentDbUser } from 'hooks/useCurrentUser';
import { useCreateSoapNote, useUpdateSoapNote } from 'hooks/useSoap';
import { usePlansByEpisode } from 'hooks/usePlans';
import React, { useEffect, useState } from 'react';
import {
  MdAnalytics,
  MdAssignment,
  MdFavorite,
  MdFitnessCenter,
  MdNotes,
  MdPerson,
} from 'react-icons/md';
import { ClinicalEpisode, EstadoPlan, SoapNote } from 'types/models';

const TODAY = new Date().toISOString().split('T')[0];

interface FormState {
  fechaSesion: string;
  motivoSesion: string;
  evaDolor: string;
  sintomasReferidos: string;
  ta: string;
  fc: string;
  fr: string;
  temperatura: string;
  spo2: string;
  peso: string;
  talla: string;
  hallazgosExamenFisico: string;
  rangoMovimiento: string;
  fuerzaMuscular: string;
  otrosHallazgos: string;
  diagnosticoFisioterapeutico: string;
  progresoVsAnterior: string;
  respuestaTratamiento: string;
  tecnicasAplicadas: string;
  ejerciciosIndicados: string;
  objetivosProximaSesion: string;
  fechaProximaSesion: string;
  observaciones: string;
}

const EMPTY: FormState = {
  fechaSesion: TODAY,
  motivoSesion: '',
  evaDolor: '',
  sintomasReferidos: '',
  ta: '',
  fc: '',
  fr: '',
  temperatura: '',
  spo2: '',
  peso: '',
  talla: '',
  hallazgosExamenFisico: '',
  rangoMovimiento: '',
  fuerzaMuscular: '',
  otrosHallazgos: '',
  diagnosticoFisioterapeutico: '',
  progresoVsAnterior: '',
  respuestaTratamiento: '',
  tecnicasAplicadas: '',
  ejerciciosIndicados: '',
  objetivosProximaSesion: '',
  fechaProximaSesion: '',
  observaciones: '',
};

function fromNote(note: SoapNote): FormState {
  const sv = note.objetivo?.signosVitales;
  return {
    fechaSesion: note.fechaSesion,
    motivoSesion: note.subjetivo?.motivoSesion ?? '',
    evaDolor: note.subjetivo?.evaDolor != null ? String(note.subjetivo.evaDolor) : '',
    sintomasReferidos: note.subjetivo?.sintomasReferidos ?? '',
    ta: sv?.ta ?? '',
    fc: sv?.fc != null ? String(sv.fc) : '',
    fr: sv?.fr != null ? String(sv.fr) : '',
    temperatura: sv?.temperatura != null ? String(sv.temperatura) : '',
    spo2: sv?.spo2 != null ? String(sv.spo2) : '',
    peso: sv?.peso != null ? String(sv.peso) : '',
    talla: sv?.talla != null ? String(sv.talla) : '',
    hallazgosExamenFisico: note.objetivo?.hallazgosExamenFisico ?? '',
    rangoMovimiento: note.objetivo?.rangoMovimiento ?? '',
    fuerzaMuscular: note.objetivo?.fuerzaMuscular ?? '',
    otrosHallazgos: note.objetivo?.otrosHallazgos ?? '',
    diagnosticoFisioterapeutico: note.analisis?.diagnosticoFisioterapeutico ?? '',
    progresoVsAnterior: note.analisis?.progresoVsAnterior ?? '',
    respuestaTratamiento: note.analisis?.respuestaTratamiento ?? '',
    tecnicasAplicadas: note.plan?.tecnicasAplicadas ?? '',
    ejerciciosIndicados: note.plan?.ejerciciosIndicados ?? '',
    objetivosProximaSesion: note.plan?.objetivosProximaSesion ?? '',
    fechaProximaSesion: note.plan?.fechaProximaSesion ?? '',
    observaciones: note.observaciones ?? '',
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  episode: ClinicalEpisode;
  editNote?: SoapNote;
}

export default function SoapNoteFormModal({ isOpen, onClose, episode, editNote }: Props) {
  const toast = useToast();
  const { data: currentUser } = useCurrentDbUser();
  const createSoap = useCreateSoapNote();
  const updateSoap = useUpdateSoapNote();
  const isEdit = !!editNote;

  const { data: plans = [] } = usePlansByEpisode(episode.pacienteId, episode.id);
  const activePlan = plans.find((p) => p.estado === EstadoPlan.ACTIVO) ?? null;

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const accordionBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const headerBg = useColorModeValue('gray.50', 'navy.700');
  const planBg = useColorModeValue('brand.50', 'navy.700');
  const planBorder = useColorModeValue('brand.200', 'brand.700');

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(isEdit && editNote ? fromNote(editNote) : { ...EMPTY, fechaSesion: TODAY });
      setErrors({});
    }
  }, [isOpen, editNote, isEdit]);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (form.motivoSesion.trim().length < 5) e.motivoSesion = 'Mínimo 5 caracteres';
    if (form.motivoSesion.trim().length > 500) e.motivoSesion = 'Máximo 500 caracteres';
    if (!form.fechaSesion) e.fechaSesion = 'Requerido';
    if (form.fechaSesion > TODAY) e.fechaSesion = 'No puede ser fecha futura';
    if (form.evaDolor !== '' && (Number(form.evaDolor) < 0 || Number(form.evaDolor) > 10))
      e.evaDolor = 'Valor entre 0 y 10';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    const sv: Record<string, string | number> = {};
    if (form.ta.trim()) sv.ta = form.ta.trim();
    if (form.fc.trim()) sv.fc = Number(form.fc);
    if (form.fr.trim()) sv.fr = Number(form.fr);
    if (form.temperatura.trim()) sv.temperatura = Number(form.temperatura);
    if (form.spo2.trim()) sv.spo2 = Number(form.spo2);
    if (form.peso.trim()) sv.peso = Number(form.peso);
    if (form.talla.trim()) sv.talla = Number(form.talla);

    return {
      fechaSesion: form.fechaSesion,
      profesionalId: currentUser!.id,
      subjetivo: {
        motivoSesion: form.motivoSesion.trim(),
        ...(form.evaDolor !== '' ? { evaDolor: Number(form.evaDolor) } : {}),
        ...(form.sintomasReferidos.trim() ? { sintomasReferidos: form.sintomasReferidos.trim() } : {}),
      },
      objetivo: {
        ...(Object.keys(sv).length ? { signosVitales: sv } : {}),
        ...(form.hallazgosExamenFisico.trim() ? { hallazgosExamenFisico: form.hallazgosExamenFisico.trim() } : {}),
        ...(form.rangoMovimiento.trim() ? { rangoMovimiento: form.rangoMovimiento.trim() } : {}),
        ...(form.fuerzaMuscular.trim() ? { fuerzaMuscular: form.fuerzaMuscular.trim() } : {}),
        ...(form.otrosHallazgos.trim() ? { otrosHallazgos: form.otrosHallazgos.trim() } : {}),
      },
      analisis: {
        ...(form.diagnosticoFisioterapeutico.trim() ? { diagnosticoFisioterapeutico: form.diagnosticoFisioterapeutico.trim() } : {}),
        ...(form.progresoVsAnterior.trim() ? { progresoVsAnterior: form.progresoVsAnterior.trim() } : {}),
        ...(form.respuestaTratamiento.trim() ? { respuestaTratamiento: form.respuestaTratamiento.trim() } : {}),
      },
      plan: {
        ...(form.tecnicasAplicadas.trim() ? { tecnicasAplicadas: form.tecnicasAplicadas.trim() } : {}),
        ...(form.ejerciciosIndicados.trim() ? { ejerciciosIndicados: form.ejerciciosIndicados.trim() } : {}),
        ...(form.objetivosProximaSesion.trim() ? { objetivosProximaSesion: form.objetivosProximaSesion.trim() } : {}),
        ...(form.fechaProximaSesion.trim() ? { fechaProximaSesion: form.fechaProximaSesion.trim() } : {}),
      },
      ...(form.observaciones.trim() ? { observaciones: form.observaciones.trim() } : {}),
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
      if (isEdit && editNote) {
        await updateSoap.mutateAsync({
          patientId: episode.pacienteId,
          episodeId: episode.id,
          soapId: editNote.id,
          payload,
        });
        toast({ title: `Sesión #${editNote.numeroSesion} actualizada`, status: 'success', duration: 2500, isClosable: true, position: 'top-right' });
      } else {
        await createSoap.mutateAsync({
          patientId: episode.pacienteId,
          episodeId: episode.id,
          payload,
        });
        toast({ title: 'Nota SOAP registrada', status: 'success', duration: 2500, isClosable: true, position: 'top-right' });
      }
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 422
          ? 'El episodio está cerrado o archivado'
          : status === 403
          ? 'Solo el autor o admin puede editar esta nota'
          : status === 400
          ? err?.response?.data?.message ?? 'Datos inválidos'
          : err?.response?.data?.message ?? 'Error al guardar';
      toast({ title: 'Error', description: msg, status: 'error', duration: 5000, isClosable: true, position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionLabel = ({ letter, title, color }: { letter: string; title: string; color: string }) => (
    <Flex align='center' gap='8px'>
      <Flex
        w='24px'
        h='24px'
        borderRadius='6px'
        bg={color}
        align='center'
        justify='center'
        flexShrink={0}>
        <Text fontSize='xs' fontWeight='800' color='white'>{letter}</Text>
      </Flex>
      <Text fontWeight='700' color={textColor} fontSize='sm'>{title}</Text>
    </Flex>
  );

  const TA = ({ label, id, fkey, placeholder, type = 'text', rows = 2, maxLen }: {
    label: string; id: string; fkey: keyof FormState;
    placeholder?: string; type?: string; rows?: number; maxLen?: number;
  }) => (
    <FormControl isInvalid={!!errors[fkey]} mb='14px'>
      <FormLabel ms='2px' fontSize='xs' fontWeight='700' color={mutedColor} mb='4px'>
        {label}
      </FormLabel>
      <Textarea
        id={id}
        value={form[fkey] as string}
        onChange={set(fkey)}
        placeholder={placeholder}
        rows={rows}
        bg={inputBg}
        border='1px solid'
        borderColor={errors[fkey] ? 'red.400' : inputBorder}
        borderRadius='12px'
        fontSize='sm'
        resize='vertical'
        maxLength={maxLen}
        _focus={{ borderColor: errors[fkey] ? 'red.400' : 'brand.500', boxShadow: 'none' }}
      />
      {errors[fkey] && <FormErrorMessage ms='4px'>{errors[fkey]}</FormErrorMessage>}
    </FormControl>
  );

  const IN = ({ label, id, fkey, placeholder, type = 'text' }: {
    label: string; id: string; fkey: keyof FormState; placeholder?: string; type?: string;
  }) => (
    <FormControl isInvalid={!!errors[fkey]} mb='14px'>
      <FormLabel ms='2px' fontSize='xs' fontWeight='700' color={mutedColor} mb='4px'>
        {label}
      </FormLabel>
      <Input
        id={id}
        type={type}
        value={form[fkey] as string}
        onChange={set(fkey)}
        placeholder={placeholder}
        bg={inputBg}
        border='1px solid'
        borderColor={errors[fkey] ? 'red.400' : inputBorder}
        borderRadius='12px'
        fontSize='sm'
        _focus={{ borderColor: errors[fkey] ? 'red.400' : 'brand.500', boxShadow: 'none' }}
      />
      {errors[fkey] && <FormErrorMessage ms='4px'>{errors[fkey]}</FormErrorMessage>}
    </FormControl>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='xl' scrollBehavior='inside'>
      <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
      <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
        <ModalHeader pb='0'>
          <Flex align='center' gap='3'>
            <Flex w='40px' h='40px' bg='brand.500' borderRadius='12px' align='center' justify='center' flexShrink={0}>
              <Icon as={MdNotes} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>
                {isEdit ? `Editar Sesión #${editNote?.numeroSesion}` : 'Nueva Nota SOAP'}
              </Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {episode.codigoHc} — {episode.motivoConsulta.slice(0, 50)}{episode.motivoConsulta.length > 50 ? '…' : ''}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='4'>
          <form id='soap-form' onSubmit={handleSubmit}>
            {/* Fecha sesión */}
            <Flex gap='16px' mb='16px' align='flex-end'>
              <FormControl isInvalid={!!errors.fechaSesion} flex={1}>
                <FormLabel ms='2px' fontSize='xs' fontWeight='700' color={mutedColor} mb='4px'>
                  Fecha de sesión *
                </FormLabel>
                <Input
                  type='date'
                  value={form.fechaSesion}
                  onChange={set('fechaSesion')}
                  max={TODAY}
                  bg={inputBg}
                  border='1px solid'
                  borderColor={errors.fechaSesion ? 'red.400' : inputBorder}
                  borderRadius='12px'
                  fontSize='sm'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                />
                {errors.fechaSesion && (
                  <FormErrorMessage ms='4px'>{errors.fechaSesion}</FormErrorMessage>
                )}
              </FormControl>
              {isEdit && editNote && (
                <Badge colorScheme='brand' borderRadius='full' px='10px' py='6px' fontSize='xs' mb='1px'>
                  Sesión #{editNote.numeroSesion}
                </Badge>
              )}
            </Flex>

            <Accordion allowMultiple defaultIndex={[0]} borderColor={accordionBorder}>
              {/* ── S — Subjetivo ── */}
              <AccordionItem border='1px solid' borderColor={accordionBorder} borderRadius='12px' mb='8px' overflow='hidden'>
                <AccordionButton px='14px' py='12px' bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
                  <Box flex={1} textAlign='left'>
                    <SectionLabel letter='S' title='Subjetivo' color='blue.400' />
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px='14px' pt='14px' pb='4px'>
                  <FormControl isInvalid={!!errors.motivoSesion} mb='14px'>
                    <FormLabel ms='2px' fontSize='xs' fontWeight='700' color={mutedColor} mb='4px'>
                      Motivo de sesión *
                    </FormLabel>
                    <Textarea
                      value={form.motivoSesion}
                      onChange={set('motivoSesion')}
                      placeholder='¿Qué refiere el paciente en esta sesión?'
                      rows={3}
                      bg={inputBg}
                      border='1px solid'
                      borderColor={errors.motivoSesion ? 'red.400' : inputBorder}
                      borderRadius='12px'
                      fontSize='sm'
                      resize='vertical'
                      maxLength={500}
                      _focus={{ borderColor: errors.motivoSesion ? 'red.400' : 'brand.500', boxShadow: 'none' }}
                    />
                    <Flex justify='space-between' mt='4px'>
                      {errors.motivoSesion
                        ? <FormErrorMessage ms='4px'>{errors.motivoSesion}</FormErrorMessage>
                        : <Box />}
                      <Text fontSize='xs' color={mutedColor}>{form.motivoSesion.length}/500</Text>
                    </Flex>
                  </FormControl>
                  <FormControl isInvalid={!!errors.evaDolor} mb='14px'>
                    <FormLabel ms='2px' fontSize='xs' fontWeight='700' color={mutedColor} mb='4px'>
                      EVA Dolor (0–10)
                    </FormLabel>
                    <Input
                      type='number'
                      min={0}
                      max={10}
                      value={form.evaDolor}
                      onChange={set('evaDolor')}
                      placeholder='0'
                      bg={inputBg}
                      border='1px solid'
                      borderColor={errors.evaDolor ? 'red.400' : inputBorder}
                      borderRadius='12px'
                      fontSize='sm'
                      w='120px'
                      _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                    />
                    {errors.evaDolor && <FormErrorMessage ms='4px'>{errors.evaDolor}</FormErrorMessage>}
                  </FormControl>
                  <TA label='Síntomas referidos' id='sintomasReferidos' fkey='sintomasReferidos' placeholder='Síntomas adicionales...' rows={2} maxLen={500} />
                </AccordionPanel>
              </AccordionItem>

              {/* ── O — Objetivo ── */}
              <AccordionItem border='1px solid' borderColor={accordionBorder} borderRadius='12px' mb='8px' overflow='hidden'>
                <AccordionButton px='14px' py='12px' bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
                  <Box flex={1} textAlign='left'>
                    <SectionLabel letter='O' title='Objetivo' color='teal.400' />
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px='14px' pt='14px' pb='4px'>
                  <Text fontSize='xs' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='wider' mb='10px'>
                    <Icon as={MdFavorite} w='10px' h='10px' mr='5px' />
                    Signos Vitales
                  </Text>
                  <Grid templateColumns='repeat(2, 1fr)' gap='0 16px'>
                    <IN label='T/A (mmHg)' id='ta' fkey='ta' placeholder='120/80' />
                    <IN label='FC (bpm)' id='fc' fkey='fc' placeholder='72' type='number' />
                    <IN label='FR (rpm)' id='fr' fkey='fr' placeholder='16' type='number' />
                    <IN label='Temperatura (°C)' id='temperatura' fkey='temperatura' placeholder='36.5' type='number' />
                    <IN label='SpO₂ (%)' id='spo2' fkey='spo2' placeholder='98' type='number' />
                    <IN label='Peso (kg)' id='peso' fkey='peso' placeholder='70.5' type='number' />
                    <IN label='Talla (m)' id='talla' fkey='talla' placeholder='1.72' type='number' />
                  </Grid>
                  <Divider mb='14px' />
                  <TA label='Hallazgos examen físico' id='hallazgosExamenFisico' fkey='hallazgosExamenFisico' placeholder='Inspección, palpación, pruebas especiales...' rows={3} maxLen={2000} />
                  <TA label='Rango de movimiento' id='rangoMovimiento' fkey='rangoMovimiento' placeholder='Flexión: 60°, Extensión: 20°...' rows={2} maxLen={1000} />
                  <TA label='Fuerza muscular' id='fuerzaMuscular' fkey='fuerzaMuscular' placeholder='Escala Daniels: glúteo mayor 4/5...' rows={2} maxLen={500} />
                  <TA label='Otros hallazgos' id='otrosHallazgos' fkey='otrosHallazgos' rows={2} maxLen={1000} />
                </AccordionPanel>
              </AccordionItem>

              {/* ── A — Análisis ── */}
              <AccordionItem border='1px solid' borderColor={accordionBorder} borderRadius='12px' mb='8px' overflow='hidden'>
                <AccordionButton px='14px' py='12px' bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
                  <Box flex={1} textAlign='left'>
                    <SectionLabel letter='A' title='Análisis' color='purple.400' />
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px='14px' pt='14px' pb='4px'>
                  <TA label='Diagnóstico fisioterapéutico' id='diagFisio' fkey='diagnosticoFisioterapeutico' placeholder='Interpretación clínica de la sesión...' rows={2} maxLen={500} />
                  <TA label='Progreso vs sesión anterior' id='progresoVsAnterior' fkey='progresoVsAnterior' placeholder='Cambios objetivos respecto a la sesión previa...' rows={2} maxLen={500} />
                  <TA label='Respuesta al tratamiento' id='respuestaTratamiento' fkey='respuestaTratamiento' placeholder='Tolerancia y respuesta del paciente...' rows={2} maxLen={500} />
                </AccordionPanel>
              </AccordionItem>

              {/* ── P — Plan ── */}
              <AccordionItem border='1px solid' borderColor={accordionBorder} borderRadius='12px' mb='8px' overflow='hidden'>
                <AccordionButton px='14px' py='12px' bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
                  <Box flex={1} textAlign='left'>
                    <SectionLabel letter='P' title='Plan' color='green.400' />
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px='14px' pt='14px' pb='4px'>
                  {/* Active treatment plan — read-only reference */}
                  {activePlan ? (
                    <Box
                      bg={planBg}
                      border='1px solid'
                      borderColor={planBorder}
                      borderRadius='10px'
                      px='12px'
                      py='10px'
                      mb='14px'>
                      <Flex align='center' gap='6px' mb='6px'>
                        <Icon as={MdFitnessCenter} w='13px' h='13px' color='brand.500' />
                        <Text fontSize='xs' fontWeight='700' color='brand.500' textTransform='uppercase' letterSpacing='wider'>
                          Plan de Tratamiento Activo
                        </Text>
                        <Badge colorScheme='brand' borderRadius='full' fontSize='9px' px='6px'>
                          Plan #{activePlan.numeroPlan}
                        </Badge>
                      </Flex>
                      <Text fontSize='sm' color={textColor} fontWeight='500' mb='4px'>
                        {activePlan.objetivoTerapeutico}
                      </Text>
                      <Flex gap='12px' flexWrap='wrap'>
                        {activePlan.duracionEstimadaSemanas && (
                          <Text fontSize='xs' color={mutedColor}>
                            Duración: <strong>{activePlan.duracionEstimadaSemanas} sem</strong>
                          </Text>
                        )}
                        {activePlan.frecuenciaSemanal && (
                          <Text fontSize='xs' color={mutedColor}>
                            Frecuencia: <strong>{activePlan.frecuenciaSemanal}×/sem</strong>
                          </Text>
                        )}
                        {activePlan.progresoPorcentaje !== undefined && (
                          <Text fontSize='xs' color={mutedColor}>
                            Progreso: <strong>{activePlan.progresoPorcentaje}%</strong>
                          </Text>
                        )}
                      </Flex>
                    </Box>
                  ) : (
                    <Box
                      bg={headerBg}
                      border='1px dashed'
                      borderColor={accordionBorder}
                      borderRadius='10px'
                      px='12px'
                      py='8px'
                      mb='14px'>
                      <Flex align='center' gap='6px'>
                        <Icon as={MdFitnessCenter} w='13px' h='13px' color={mutedColor} />
                        <Text fontSize='xs' color={mutedColor} fontStyle='italic'>
                          Sin plan de tratamiento activo en este episodio
                        </Text>
                      </Flex>
                    </Box>
                  )}
                  <TA label='Técnicas aplicadas' id='tecnicasAplicadas' fkey='tecnicasAplicadas' placeholder='TENS, tracción lumbar, masoterapia...' rows={2} maxLen={1000} />
                  <TA label='Ejercicios indicados' id='ejerciciosIndicados' fkey='ejerciciosIndicados' placeholder='Williams x10 reps, puente glúteo x15...' rows={2} maxLen={1000} />
                  <TA label='Objetivos próxima sesión' id='objetivosProximaSesion' fkey='objetivosProximaSesion' placeholder='Alcanzar flexión 75°, reducir EVA a 3...' rows={2} maxLen={500} />
                  <IN label='Fecha próxima sesión' id='fechaProximaSesion' fkey='fechaProximaSesion' type='date' />
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            {/* Observaciones generales */}
            <Box mt='12px'>
              <Text fontSize='xs' fontWeight='700' color={mutedColor} textTransform='uppercase' letterSpacing='wider' mb='8px'>
                <Icon as={MdAssignment} w='10px' h='10px' mr='5px' />
                Observaciones adicionales
              </Text>
              <FormControl>
                <Textarea
                  value={form.observaciones}
                  onChange={set('observaciones')}
                  placeholder='Notas libres, indicaciones para próxima consulta...'
                  rows={2}
                  bg={inputBg}
                  border='1px solid'
                  borderColor={inputBorder}
                  borderRadius='12px'
                  fontSize='sm'
                  resize='vertical'
                  maxLength={1000}
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                />
                <Text mt='4px' ms='4px' fontSize='xs' color={mutedColor}>{form.observaciones.length}/1000</Text>
              </FormControl>
            </Box>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>Cancelar</Button>
          <Button
            type='submit'
            form='soap-form'
            isLoading={isSubmitting}
            leftIcon={<Icon as={isEdit ? MdAnalytics : MdNotes} />}>
            {isEdit ? 'Guardar cambios' : 'Registrar sesión'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

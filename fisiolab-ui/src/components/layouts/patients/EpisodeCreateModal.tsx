import {
  Badge,
  Box,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Step,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  Textarea,
  useColorModeValue,
  useSteps,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import { useCurrentDbUser } from 'hooks/useCurrentUser';
import { useCreateEpisode, useUpdateEpisode } from 'hooks/useEpisodes';
import { useCreateEvaluation } from 'hooks/useEvaluations';
import React, { useEffect, useState } from 'react';
import {
  MdLocalHospital,
  MdMedicalServices,
  MdScience,
  MdSkipNext,
} from 'react-icons/md';

const TODAY = new Date().toISOString().split('T')[0];

const STEPS = [
  { title: 'Episodio', description: 'Motivo de consulta' },
  { title: 'Diagnóstico', description: 'Impresión diagnóstica' },
  { title: 'Evaluación', description: 'Evaluación inicial' },
];

// ─── Module-level sub-components (NEVER define inside parent component) ───────
// Defining inside parent creates a new component type each render → unmount/remount →
// cursor jumps to start of textarea on each keystroke.

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLen,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLen?: number;
  required?: boolean;
}) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  return (
    <FormControl mb='16px'>
      <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
        {label}{' '}
        {!required && (
          <Text as='span' fontWeight='400' color={mutedColor}>
            (opcional)
          </Text>
        )}
      </FormLabel>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        bg={inputBg}
        border='1px solid'
        borderColor={inputBorder}
        borderRadius='16px'
        fontSize='sm'
        resize='vertical'
        maxLength={maxLen}
        _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
      />
    </FormControl>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export default function EpisodeCreateModal({ isOpen, onClose, patientId }: Props) {
  const toast = useToast();
  const { data: currentUser, isLoading: userLoading } = useCurrentDbUser();
  const createEpisode = useCreateEpisode();
  const updateEpisode = useUpdateEpisode();
  const createEval = useCreateEvaluation();

  const { activeStep, setActiveStep } = useSteps({ index: 0, count: STEPS.length });

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const sectionColor = useColorModeValue('brand.500', 'brand.400');

  // Step 1 — episode
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [notaApertura, setNotaApertura] = useState('');
  const [motivoError, setMotivoError] = useState('');

  // Step 2 — diagnosis
  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState('');
  const [codigoCie10, setCodigoCie10] = useState('');
  const [diagnosticoSecundario, setDiagnosticoSecundario] = useState('');

  // Step 3 — evaluation
  const [escalaDolor, setEscalaDolor] = useState('');
  const [inspeccion, setInspeccion] = useState('');
  const [palpacion, setPalpacion] = useState('');
  const [diagnosticoFisio, setDiagnosticoFisio] = useState('');
  const [evaError, setEvaError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEpisodeId, setCreatedEpisodeId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
      setMotivoConsulta('');
      setNotaApertura('');
      setMotivoError('');
      setDiagnosticoPrincipal('');
      setCodigoCie10('');
      setDiagnosticoSecundario('');
      setEscalaDolor('');
      setInspeccion('');
      setPalpacion('');
      setDiagnosticoFisio('');
      setEvaError('');
      setCreatedEpisodeId(null);
    }
  }, [isOpen]);

  const noUserError = () =>
    toast({
      title: 'Error de sesión',
      description: 'Recargue la página',
      status: 'error',
      duration: 4000,
      isClosable: true,
      position: 'top-right',
    });

  // ── Paso 1: crear episodio ────────────────────────────────────────────────
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivoConsulta.trim().length < 5) { setMotivoError('Mínimo 5 caracteres'); return; }
    if (motivoConsulta.trim().length > 500) { setMotivoError('Máximo 500 caracteres'); return; }
    setMotivoError('');
    if (!currentUser?.id) { noUserError(); return; }

    setIsSubmitting(true);
    try {
      const ep = await createEpisode.mutateAsync({
        patientId,
        payload: {
          motivoConsulta: motivoConsulta.trim(),
          profesionalId: currentUser.id,
          notaApertura: notaApertura.trim() || undefined,
        },
      });
      setCreatedEpisodeId(ep.id);
      setActiveStep(1);
    } catch (err: any) {
      const msg =
        err?.response?.status === 422
          ? 'El tarjetero del paciente no está activo'
          : err?.response?.data?.message ?? 'Error al crear episodio';
      toast({
        title: 'Error',
        description: msg,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Paso 2: diagnóstico (opcional, PATCH sobre episodio creado) ───────────
  const handleStep2 = async (skip: boolean) => {
    if (skip || !createdEpisodeId) {
      setActiveStep(2);
      return;
    }

    const payload: Record<string, string> = {};
    if (diagnosticoPrincipal.trim()) payload.diagnosticoPrincipal = diagnosticoPrincipal.trim();
    if (codigoCie10.trim()) payload.codigoCie10 = codigoCie10.trim().toUpperCase();
    if (diagnosticoSecundario.trim()) payload.diagnosticoSecundario = diagnosticoSecundario.trim();

    if (Object.keys(payload).length === 0) {
      setActiveStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateEpisode.mutateAsync({
        patientId,
        episodeId: createdEpisodeId,
        payload,
      });
      toast({
        title: 'Diagnóstico registrado',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
    } catch {
      toast({
        title: 'Diagnóstico no guardado',
        description: 'Podrás añadirlo desde la historia clínica',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
      setActiveStep(2);
    }
  };

  // ── Paso 3: evaluación inicial (opcional) ────────────────────────────────
  const handleStep3 = async (skip: boolean) => {
    if (skip || !currentUser?.id || !createdEpisodeId) { onClose(); return; }

    const hasData =
      escalaDolor.trim() || inspeccion.trim() || palpacion.trim() || diagnosticoFisio.trim();
    if (!hasData) { onClose(); return; }

    if (escalaDolor.trim() && (Number(escalaDolor) < 0 || Number(escalaDolor) > 10)) {
      setEvaError('Valor entre 0 y 10');
      return;
    }
    setEvaError('');

    setIsSubmitting(true);
    try {
      await createEval.mutateAsync({
        patientId,
        episodeId: createdEpisodeId,
        payload: {
          fechaEvaluacion: TODAY,
          profesionalId: currentUser.id,
          ...(escalaDolor.trim() ? { escalaDolor: Number(escalaDolor) } : {}),
          ...(inspeccion.trim() ? { inspeccion: inspeccion.trim() } : {}),
          ...(palpacion.trim() ? { palpacion: palpacion.trim() } : {}),
          ...(diagnosticoFisio.trim() ? { diagnostico: diagnosticoFisio.trim() } : {}),
        },
      });
      toast({
        title: 'Evaluación inicial registrada',
        status: 'success',
        duration: 2500,
        isClosable: true,
        position: 'top-right',
      });
    } catch {
      toast({
        title: 'Episodio creado',
        description: 'No se pudo guardar la evaluación inicial — agrégala desde el tab Evaluaciones',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const stepIcon = [MdMedicalServices, MdLocalHospital, MdScience][activeStep] ?? MdMedicalServices;
  const stepBg = ['brand.500', 'purple.500', 'teal.500'][activeStep] ?? 'brand.500';
  const stepLabel = [
    'Nuevo Episodio Clínico',
    'Diagnóstico',
    'Evaluación Inicial',
  ][activeStep];
  const stepSub = [
    'Paso 1 de 3 — Apertura de episodio',
    'Paso 2 de 3 — Impresión diagnóstica (opcional)',
    'Paso 3 de 3 — Evaluación inicial del paciente',
  ][activeStep];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='lg'
      scrollBehavior='inside'
      closeOnOverlayClick={false}>
      <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
      <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
        <ModalHeader pb='0'>
          <Flex align='center' gap='3' mb='20px'>
            <Flex
              w='40px'
              h='40px'
              bg={stepBg}
              borderRadius='12px'
              align='center'
              justify='center'
              flexShrink={0}
              transition='background 0.3s'>
              <Icon as={stepIcon} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>
                {stepLabel}
              </Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {stepSub}
              </Text>
            </Flex>
          </Flex>

          <Stepper index={activeStep} colorScheme='brand' size='sm' gap='0'>
            {STEPS.map((step, i) => (
              <Step key={i}>
                <StepIndicator>
                  <StepStatus
                    complete={<>✓</>}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>
                <Box flexShrink={0}>
                  <StepTitle>{step.title}</StepTitle>
                </Box>
                <StepSeparator />
              </Step>
            ))}
          </Stepper>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        {/* ── Step 1: Episodio ─────────────────────────────────────────── */}
        {activeStep === 0 && (
          <>
            <ModalBody pt='20px' pb='6'>
              <form id='step1-form' onSubmit={handleStep1}>
                <Text
                  color={sectionColor}
                  fontSize='xs'
                  fontWeight='800'
                  textTransform='uppercase'
                  letterSpacing='wider'
                  mb='12px'>
                  Motivo de Consulta
                </Text>
                <FormControl isInvalid={!!motivoError} mb='20px'>
                  <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                    Motivo{' '}
                    <Text as='span' fontWeight='400' color={mutedColor}>
                      (requerido, 5–500 chars)
                    </Text>
                  </FormLabel>
                  <Textarea
                    value={motivoConsulta}
                    onChange={(e) => {
                      setMotivoConsulta(e.target.value);
                      if (motivoError) setMotivoError('');
                    }}
                    placeholder='Ej: Dolor lumbar crónico con irradiación a miembro inferior derecho...'
                    rows={3}
                    bg={inputBg}
                    border='1px solid'
                    borderColor={motivoError ? 'red.400' : inputBorder}
                    borderRadius='16px'
                    fontSize='sm'
                    resize='vertical'
                    _focus={{ borderColor: motivoError ? 'red.400' : 'brand.500', boxShadow: 'none' }}
                  />
                  {motivoError ? (
                    <FormErrorMessage ms='10px'>{motivoError}</FormErrorMessage>
                  ) : (
                    <Text mt='4px' ms='10px' fontSize='xs' color={mutedColor}>
                      {motivoConsulta.length}/500
                    </Text>
                  )}
                </FormControl>

                <Divider mb='20px' />

                <Text
                  color={sectionColor}
                  fontSize='xs'
                  fontWeight='800'
                  textTransform='uppercase'
                  letterSpacing='wider'
                  mb='12px'>
                  Nota de Apertura
                </Text>
                <TextareaField
                  label='Nota inicial'
                  value={notaApertura}
                  onChange={setNotaApertura}
                  placeholder='Ej: Paciente refiere 3 semanas de evolución. EVA 7/10...'
                  rows={4}
                  maxLen={2000}
                />
              </form>
            </ModalBody>
            <ModalFooter gap='3'>
              <Button variant='light' onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type='submit'
                form='step1-form'
                isLoading={isSubmitting || userLoading}
                isDisabled={userLoading}
                leftIcon={<Icon as={MdMedicalServices} />}>
                Abrir Episodio →
              </Button>
            </ModalFooter>
          </>
        )}

        {/* ── Step 2: Diagnóstico ──────────────────────────────────────── */}
        {activeStep === 1 && (
          <>
            <ModalBody pt='20px' pb='6'>
              <Flex
                align='center'
                gap='8px'
                mb='20px'
                p='10px'
                bg='purple.50'
                borderRadius='10px'
                border='1px solid'
                borderColor='purple.100'>
                <Icon as={MdLocalHospital} color='purple.500' w='16px' h='16px' flexShrink={0} />
                <Text fontSize='xs' color='purple.700' fontWeight='600'>
                  Registra la impresión diagnóstica inicial. Puedes completarla o modificarla en cualquier momento desde la historia clínica.
                </Text>
              </Flex>

              <Text
                color='purple.500'
                fontSize='xs'
                fontWeight='800'
                textTransform='uppercase'
                letterSpacing='wider'
                mb='12px'>
                Diagnóstico Principal
              </Text>

              <TextareaField
                label='Diagnóstico principal'
                value={diagnosticoPrincipal}
                onChange={setDiagnosticoPrincipal}
                placeholder='Ej: Síndrome de dolor lumbar crónico con radiculopatía L4-L5...'
                rows={3}
                maxLen={500}
              />

              <FormControl mb='16px'>
                <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                  Código CIE-10{' '}
                  <Text as='span' fontWeight='400' color={mutedColor}>
                    (opcional)
                  </Text>
                </FormLabel>
                <Input
                  value={codigoCie10}
                  onChange={(e) => setCodigoCie10(e.target.value)}
                  placeholder='Ej: M51.1'
                  bg={inputBg}
                  border='1px solid'
                  borderColor={inputBorder}
                  borderRadius='16px'
                  fontSize='sm'
                  w='160px'
                  textTransform='uppercase'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                />
              </FormControl>

              <Divider mb='16px' />

              <Text
                color='purple.500'
                fontSize='xs'
                fontWeight='800'
                textTransform='uppercase'
                letterSpacing='wider'
                mb='12px'>
                Diagnóstico Secundario
              </Text>

              <TextareaField
                label='Diagnóstico secundario'
                value={diagnosticoSecundario}
                onChange={setDiagnosticoSecundario}
                placeholder='Comorbilidades relevantes para el tratamiento...'
                rows={2}
                maxLen={500}
              />
            </ModalBody>
            <ModalFooter gap='3'>
              <Button
                variant='light'
                leftIcon={<Icon as={MdSkipNext} />}
                onClick={() => handleStep2(true)}
                isDisabled={isSubmitting}>
                Omitir
              </Button>
              <Button
                colorScheme='purple'
                isLoading={isSubmitting}
                leftIcon={<Icon as={MdLocalHospital} />}
                onClick={() => handleStep2(false)}>
                Guardar diagnóstico →
              </Button>
            </ModalFooter>
          </>
        )}

        {/* ── Step 3: Evaluación inicial ───────────────────────────────── */}
        {activeStep === 2 && (
          <>
            <ModalBody pt='20px' pb='6'>
              <Flex
                align='center'
                gap='8px'
                mb='16px'
                p='10px'
                bg='teal.50'
                borderRadius='10px'
                border='1px solid'
                borderColor='teal.100'>
                <Icon as={MdScience} color='teal.500' w='16px' h='16px' flexShrink={0} />
                <Text fontSize='xs' color='teal.700' fontWeight='600'>
                  Registra la evaluación física inicial. Puedes completar todos los detalles desde el tab{' '}
                  <Badge colorScheme='teal' fontSize='10px'>
                    Evaluaciones
                  </Badge>{' '}
                  cuando quieras.
                </Text>
              </Flex>

              <Text
                color='teal.500'
                fontSize='xs'
                fontWeight='800'
                textTransform='uppercase'
                letterSpacing='wider'
                mb='12px'>
                Datos Básicos
              </Text>

              <FormControl isInvalid={!!evaError} mb='16px'>
                <FormLabel ms='10px' fontSize='sm' color={textColor} fontWeight='bold'>
                  EVA Dolor (0–10){' '}
                  <Text as='span' fontWeight='400' color={mutedColor}>
                    (opcional)
                  </Text>
                </FormLabel>
                <Input
                  type='number'
                  min={0}
                  max={10}
                  value={escalaDolor}
                  onChange={(e) => {
                    setEscalaDolor(e.target.value);
                    if (evaError) setEvaError('');
                  }}
                  placeholder='0'
                  bg={inputBg}
                  border='1px solid'
                  borderColor={evaError ? 'red.400' : inputBorder}
                  borderRadius='16px'
                  fontSize='sm'
                  w='140px'
                  _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                />
                {evaError && <FormErrorMessage ms='10px'>{evaError}</FormErrorMessage>}
              </FormControl>

              <TextareaField
                label='Inspección'
                value={inspeccion}
                onChange={setInspeccion}
                placeholder='Postura, actitud antálgica, observaciones visuales...'
                rows={2}
                maxLen={2000}
              />
              <TextareaField
                label='Palpación'
                value={palpacion}
                onChange={setPalpacion}
                placeholder='Puntos gatillo, tensión muscular, temperatura...'
                rows={2}
                maxLen={2000}
              />
              <TextareaField
                label='Diagnóstico fisioterapéutico'
                value={diagnosticoFisio}
                onChange={setDiagnosticoFisio}
                placeholder='Impresión diagnóstica fisioterapéutica inicial...'
                rows={2}
                maxLen={1000}
              />
            </ModalBody>
            <ModalFooter gap='3'>
              <Button
                variant='light'
                leftIcon={<Icon as={MdSkipNext} />}
                onClick={() => handleStep3(true)}
                isDisabled={isSubmitting}>
                Omitir
              </Button>
              <Button
                colorScheme='teal'
                isLoading={isSubmitting}
                leftIcon={<Icon as={MdScience} />}
                onClick={() => handleStep3(false)}>
                Guardar evaluación
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

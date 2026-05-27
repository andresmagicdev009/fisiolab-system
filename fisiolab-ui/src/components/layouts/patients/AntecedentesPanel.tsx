import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import Button from 'components/ui/Button';
import {
  useGineco,
  useHeredofamiliares,
  useNoPatologicos,
  usePatologicos,
  useUpdateGineco,
  useUpdateHeredofamiliares,
  useUpdateNoPatologicos,
  useUpdatePatologicos,
} from 'hooks/useAntecedentes';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  MdFamilyRestroom,
  MdFemale,
  MdLocalHospital,
  MdSave,
  MdSelfImprovement,
} from 'react-icons/md';
import {
  AntecedentesGineco,
  AntecedentesHeredofamiliar,
  AntecedentesNoPatologico,
  AntecedentesPatologico,
  AntecedentesCompletos,
  Genero,
  Patient,
} from 'types/models';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasData(record: object | null): boolean {
  if (!record) return false;
  return Object.values(record).some((v) => v === true || (typeof v === 'string' && v.length > 0));
}

function CompletionBadge({ record }: { record: object | null }) {
  const filled = hasData(record);
  const color = record === null ? 'gray.300' : filled ? 'green.400' : 'yellow.400';
  const label = record === null ? 'Pendiente' : filled ? 'Con datos' : 'Iniciado';
  return (
    <Flex align='center' gap='1.5'>
      <Box w='8px' h='8px' borderRadius='full' bg={color} flexShrink={0} />
      <Text fontSize='10px' color='secondaryGray.500' fontWeight='600'>
        {label}
      </Text>
    </Flex>
  );
}

// ─── Heredo-familiar form ────────────────────────────────────────────────────

type HFForm = Pick<
  AntecedentesHeredofamiliar,
  | 'diabetes' | 'hipertension' | 'cardiopatias' | 'cancer'
  | 'enfermedadesRespiratorias' | 'enfermedadesRenales'
  | 'enfermedadesNeurologicas' | 'enfermedadesMentales'
  | 'diabetesFamiliar' | 'hipertensionFamiliar' | 'cardiopatiasFamiliar'
  | 'cancerFamiliar' | 'cancerTipo'
>;

const HF_CONDITIONS: { key: keyof HFForm; label: string; familiarKey?: keyof HFForm; tipoKey?: keyof HFForm }[] = [
  { key: 'diabetes', label: 'Diabetes', familiarKey: 'diabetesFamiliar' },
  { key: 'hipertension', label: 'Hipertensión', familiarKey: 'hipertensionFamiliar' },
  { key: 'cardiopatias', label: 'Cardiopatías', familiarKey: 'cardiopatiasFamiliar' },
  { key: 'cancer', label: 'Cáncer', familiarKey: 'cancerFamiliar', tipoKey: 'cancerTipo' },
  { key: 'enfermedadesRespiratorias', label: 'Enf. Respiratorias' },
  { key: 'enfermedadesRenales', label: 'Enf. Renales' },
  { key: 'enfermedadesNeurologicas', label: 'Enf. Neurológicas' },
  { key: 'enfermedadesMentales', label: 'Enf. Mentales' },
];

function HeredofamiliarForm({ patientId }: { patientId: string }) {
  const { data, isLoading } = useHeredofamiliares(patientId);
  const update = useUpdateHeredofamiliares(patientId);
  const toast = useToast();
  const labelColor = useColorModeValue('secondaryGray.700', 'secondaryGray.300');
  const inputBg = useColorModeValue('gray.50', 'navy.700');

  const { control, handleSubmit, reset, watch } = useForm<HFForm>({
    defaultValues: {
      diabetes: false, hipertension: false, cardiopatias: false, cancer: false,
      enfermedadesRespiratorias: false, enfermedadesRenales: false,
      enfermedadesNeurologicas: false, enfermedadesMentales: false,
      diabetesFamiliar: '', hipertensionFamiliar: '', cardiopatiasFamiliar: '',
      cancerFamiliar: '', cancerTipo: '',
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        diabetes: data.diabetes ?? false,
        hipertension: data.hipertension ?? false,
        cardiopatias: data.cardiopatias ?? false,
        cancer: data.cancer ?? false,
        enfermedadesRespiratorias: data.enfermedadesRespiratorias ?? false,
        enfermedadesRenales: data.enfermedadesRenales ?? false,
        enfermedadesNeurologicas: data.enfermedadesNeurologicas ?? false,
        enfermedadesMentales: data.enfermedadesMentales ?? false,
        diabetesFamiliar: data.diabetesFamiliar ?? '',
        hipertensionFamiliar: data.hipertensionFamiliar ?? '',
        cardiopatiasFamiliar: data.cardiopatiasFamiliar ?? '',
        cancerFamiliar: data.cancerFamiliar ?? '',
        cancerTipo: data.cancerTipo ?? '',
      });
    }
  }, [data, reset]);

  if (isLoading) return <Skeleton h='160px' borderRadius='12px' />;

  const onSubmit = async (values: HFForm) => {
    try {
      await update.mutateAsync({
        diabetes: values.diabetes,
        hipertension: values.hipertension,
        cardiopatias: values.cardiopatias,
        cancer: values.cancer,
        enfermedadesRespiratorias: values.enfermedadesRespiratorias,
        enfermedadesRenales: values.enfermedadesRenales,
        enfermedadesNeurologicas: values.enfermedadesNeurologicas,
        enfermedadesMentales: values.enfermedadesMentales,
        diabetesFamiliar: values.diabetesFamiliar || null,
        hipertensionFamiliar: values.hipertensionFamiliar || null,
        cardiopatiasFamiliar: values.cardiopatiasFamiliar || null,
        cancerFamiliar: values.cancerFamiliar || null,
        cancerTipo: values.cancerTipo || null,
      });
      toast({ title: 'Guardado', status: 'success', duration: 2000, position: 'top-right' });
    } catch {
      toast({ title: 'Error al guardar', status: 'error', duration: 3000, position: 'top-right' });
    }
  };

  const checkedConditions = HF_CONDITIONS.filter((c) => watch(c.key));

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SimpleGrid columns={2} gap='8px' mb='12px'>
        {HF_CONDITIONS.map(({ key, label }) => (
          <Controller
            key={key}
            name={key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <Checkbox
                isChecked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                size='sm'
                colorScheme='brand'>
                <Text fontSize='sm'>{label}</Text>
              </Checkbox>
            )}
          />
        ))}
      </SimpleGrid>

      {checkedConditions.length > 0 && (
        <Flex direction='column' gap='8px' mb='12px'>
          {checkedConditions.map(({ key, label, familiarKey, tipoKey }) => (
            <Box key={key}>
              <Text fontSize='11px' color={labelColor} fontWeight='600' mb='4px'>
                {label} — familiar afectado
              </Text>
              <Flex gap='8px'>
                {familiarKey && (
                  <Controller
                    name={familiarKey}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={String(field.value ?? '')}
                        size='sm'
                        placeholder='Padre, madre...'
                        bg={inputBg}
                        borderRadius='8px'
                        fontSize='sm'
                      />
                    )}
                  />
                )}
                {tipoKey && (
                  <Controller
                    name={tipoKey}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={String(field.value ?? '')}
                        size='sm'
                        placeholder='Tipo...'
                        bg={inputBg}
                        borderRadius='8px'
                        fontSize='sm'
                      />
                    )}
                  />
                )}
              </Flex>
            </Box>
          ))}
        </Flex>
      )}

      <Button
        type='submit'
        size='sm'
        variant='brand'
        w='100%'
        isLoading={update.isPending}
        leftIcon={<Icon as={MdSave} />}>
        Guardar
      </Button>
    </form>
  );
}

// ─── Patológico form ─────────────────────────────────────────────────────────

type PatForm = Pick<
  AntecedentesPatologico,
  | 'diabetesMellitus' | 'hipertensionArterial' | 'cardiopatias' | 'cancer'
  | 'tuberculosis' | 'hepatitis' | 'vihSida' | 'covid19'
  | 'epilepsia' | 'accidenteCerebrovascular' | 'depresion' | 'ansiedad'
  | 'transfusiones' | 'diabetesTratamiento' | 'hipertensionTratamiento'
  | 'cancerTipo' | 'hepatitisTipo'
>;

const PAT_CONDITIONS: { key: keyof PatForm; label: string }[] = [
  { key: 'diabetesMellitus', label: 'Diabetes Mellitus' },
  { key: 'hipertensionArterial', label: 'Hipertensión Arterial' },
  { key: 'cardiopatias', label: 'Cardiopatías' },
  { key: 'cancer', label: 'Cáncer' },
  { key: 'tuberculosis', label: 'Tuberculosis' },
  { key: 'hepatitis', label: 'Hepatitis' },
  { key: 'vihSida', label: 'VIH/SIDA' },
  { key: 'covid19', label: 'COVID-19' },
  { key: 'epilepsia', label: 'Epilepsia' },
  { key: 'accidenteCerebrovascular', label: 'ACV' },
  { key: 'depresion', label: 'Depresión' },
  { key: 'ansiedad', label: 'Ansiedad' },
  { key: 'transfusiones', label: 'Transfusiones' },
];

function PatologicoForm({ patientId }: { patientId: string }) {
  const { data, isLoading } = usePatologicos(patientId);
  const update = useUpdatePatologicos(patientId);
  const toast = useToast();
  const inputBg = useColorModeValue('gray.50', 'navy.700');

  const { control, handleSubmit, reset, watch } = useForm<PatForm>({
    defaultValues: PAT_CONDITIONS.reduce((acc, { key }) => ({ ...acc, [key]: false }), {} as PatForm),
  });

  useEffect(() => {
    if (data) {
      reset({
        diabetesMellitus: data.diabetesMellitus ?? false,
        hipertensionArterial: data.hipertensionArterial ?? false,
        cardiopatias: data.cardiopatias ?? false,
        cancer: data.cancer ?? false,
        tuberculosis: data.tuberculosis ?? false,
        hepatitis: data.hepatitis ?? false,
        vihSida: data.vihSida ?? false,
        covid19: data.covid19 ?? false,
        epilepsia: data.epilepsia ?? false,
        accidenteCerebrovascular: data.accidenteCerebrovascular ?? false,
        depresion: data.depresion ?? false,
        ansiedad: data.ansiedad ?? false,
        transfusiones: data.transfusiones ?? false,
        diabetesTratamiento: data.diabetesTratamiento ?? '',
        hipertensionTratamiento: data.hipertensionTratamiento ?? '',
        cancerTipo: data.cancerTipo ?? '',
        hepatitisTipo: data.hepatitisTipo ?? '',
      });
    }
  }, [data, reset]);

  if (isLoading) return <Skeleton h='160px' borderRadius='12px' />;

  const onSubmit = async (values: PatForm) => {
    try {
      await update.mutateAsync({
        diabetesMellitus: values.diabetesMellitus,
        hipertensionArterial: values.hipertensionArterial,
        cardiopatias: values.cardiopatias,
        cancer: values.cancer,
        tuberculosis: values.tuberculosis,
        hepatitis: values.hepatitis,
        vihSida: values.vihSida,
        covid19: values.covid19,
        epilepsia: values.epilepsia,
        accidenteCerebrovascular: values.accidenteCerebrovascular,
        depresion: values.depresion,
        ansiedad: values.ansiedad,
        transfusiones: values.transfusiones,
        diabetesTratamiento: values.diabetesTratamiento || null,
        hipertensionTratamiento: values.hipertensionTratamiento || null,
        cancerTipo: values.cancerTipo || null,
        hepatitisTipo: values.hepatitisTipo || null,
      });
      toast({ title: 'Guardado', status: 'success', duration: 2000, position: 'top-right' });
    } catch {
      toast({ title: 'Error al guardar', status: 'error', duration: 3000, position: 'top-right' });
    }
  };

  const hasDiabetes = watch('diabetesMellitus');
  const hasHTA = watch('hipertensionArterial');
  const hasCancer = watch('cancer');
  const hasHepatitis = watch('hepatitis');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SimpleGrid columns={2} gap='8px' mb='12px'>
        {PAT_CONDITIONS.map(({ key, label }) => (
          <Controller
            key={key}
            name={key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <Checkbox
                isChecked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                size='sm'
                colorScheme='brand'>
                <Text fontSize='sm'>{label}</Text>
              </Checkbox>
            )}
          />
        ))}
      </SimpleGrid>

      {(hasDiabetes || hasHTA || hasCancer || hasHepatitis) && (
        <SimpleGrid columns={1} gap='8px' mb='12px'>
          {hasDiabetes && (
            <Controller
              name='diabetesTratamiento'
              control={control}
              render={({ field }) => (
                <FormControl size='sm'>
                  <FormLabel fontSize='11px' fontWeight='600' mb='4px'>
                    Tratamiento diabetes
                  </FormLabel>
                  <Input {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' placeholder='Metformina...' />
                </FormControl>
              )}
            />
          )}
          {hasHTA && (
            <Controller
              name='hipertensionTratamiento'
              control={control}
              render={({ field }) => (
                <FormControl size='sm'>
                  <FormLabel fontSize='11px' fontWeight='600' mb='4px'>
                    Tratamiento HTA
                  </FormLabel>
                  <Input {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' placeholder='Losartán...' />
                </FormControl>
              )}
            />
          )}
          {hasCancer && (
            <Controller
              name='cancerTipo'
              control={control}
              render={({ field }) => (
                <FormControl size='sm'>
                  <FormLabel fontSize='11px' fontWeight='600' mb='4px'>
                    Tipo de cáncer
                  </FormLabel>
                  <Input {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' placeholder='Mama, pulmón...' />
                </FormControl>
              )}
            />
          )}
          {hasHepatitis && (
            <Controller
              name='hepatitisTipo'
              control={control}
              render={({ field }) => (
                <FormControl size='sm'>
                  <FormLabel fontSize='11px' fontWeight='600' mb='4px'>
                    Tipo hepatitis
                  </FormLabel>
                  <Select {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px'>
                    <option value=''>Seleccionar...</option>
                    {['A', 'B', 'C', 'D', 'E'].map((t) => (
                      <option key={t} value={t}>Hepatitis {t}</option>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          )}
        </SimpleGrid>
      )}

      <Button
        type='submit'
        size='sm'
        variant='brand'
        w='100%'
        isLoading={update.isPending}
        leftIcon={<Icon as={MdSave} />}>
        Guardar
      </Button>
    </form>
  );
}

// ─── No patológico form ──────────────────────────────────────────────────────

type NPForm = Pick<
  AntecedentesNoPatologico,
  | 'tabaquismo' | 'tabaquismoTipo' | 'tabaquismoCigarrillosDia'
  | 'alcoholismo' | 'alcoholismoFrecuencia'
  | 'drogas' | 'drogasTipo'
  | 'cafe' | 'cafeTazasDia'
  | 'actividadFisica' | 'actividadFisicaTipo' | 'actividadFisicaFrecuencia'
  | 'alimentacionTipo' | 'alimentacionComidasDia'
  | 'horasSuenoPromedio' | 'calidadSueno'
  | 'esquemaVacunacionCompleto' | 'otrosHabitos'
>;

function NoPatologicoForm({ patientId }: { patientId: string }) {
  const { data, isLoading } = useNoPatologicos(patientId);
  const update = useUpdateNoPatologicos(patientId);
  const toast = useToast();
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const labelColor = useColorModeValue('secondaryGray.700', 'secondaryGray.300');

  const { control, handleSubmit, reset, watch } = useForm<NPForm>({
    defaultValues: {
      tabaquismo: false, alcoholismo: false, drogas: false, cafe: false,
      actividadFisica: false, alimentacionComidasDia: 3,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        tabaquismo: data.tabaquismo ?? false,
        tabaquismoTipo: data.tabaquismoTipo ?? '',
        tabaquismoCigarrillosDia: data.tabaquismoCigarrillosDia ?? null,
        alcoholismo: data.alcoholismo ?? false,
        alcoholismoFrecuencia: data.alcoholismoFrecuencia ?? '',
        drogas: data.drogas ?? false,
        drogasTipo: data.drogasTipo ?? '',
        cafe: data.cafe ?? false,
        cafeTazasDia: data.cafeTazasDia ?? null,
        actividadFisica: data.actividadFisica ?? false,
        actividadFisicaTipo: data.actividadFisicaTipo ?? '',
        actividadFisicaFrecuencia: data.actividadFisicaFrecuencia ?? '',
        alimentacionTipo: data.alimentacionTipo ?? '',
        alimentacionComidasDia: data.alimentacionComidasDia ?? 3,
        horasSuenoPromedio: data.horasSuenoPromedio ?? null,
        calidadSueno: data.calidadSueno ?? '',
        esquemaVacunacionCompleto: data.esquemaVacunacionCompleto ?? false,
        otrosHabitos: data.otrosHabitos ?? '',
      });
    }
  }, [data, reset]);

  if (isLoading) return <Skeleton h='160px' borderRadius='12px' />;

  const onSubmit = async (values: NPForm) => {
    try {
      await update.mutateAsync({
        tabaquismo: values.tabaquismo,
        tabaquismoTipo: values.tabaquismoTipo || null,
        tabaquismoCigarrillosDia: values.tabaquismoCigarrillosDia ?? null,
        alcoholismo: values.alcoholismo,
        alcoholismoFrecuencia: values.alcoholismoFrecuencia || null,
        drogas: values.drogas,
        drogasTipo: values.drogasTipo || null,
        cafe: values.cafe,
        cafeTazasDia: values.cafeTazasDia ?? null,
        actividadFisica: values.actividadFisica,
        actividadFisicaTipo: values.actividadFisicaTipo || null,
        actividadFisicaFrecuencia: values.actividadFisicaFrecuencia || null,
        alimentacionTipo: values.alimentacionTipo || null,
        alimentacionComidasDia: values.alimentacionComidasDia,
        horasSuenoPromedio: values.horasSuenoPromedio ?? null,
        calidadSueno: values.calidadSueno || null,
        esquemaVacunacionCompleto: values.esquemaVacunacionCompleto,
        otrosHabitos: values.otrosHabitos || null,
      });
      toast({ title: 'Guardado', status: 'success', duration: 2000, position: 'top-right' });
    } catch {
      toast({ title: 'Error al guardar', status: 'error', duration: 3000, position: 'top-right' });
    }
  };

  const hasTabaquismo = watch('tabaquismo');
  const hasAlcohol = watch('alcoholismo');
  const hasDrogas = watch('drogas');
  const hasCafe = watch('cafe');
  const hasActividad = watch('actividadFisica');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Text fontSize='11px' color={labelColor} fontWeight='700' textTransform='uppercase' letterSpacing='wider' mb='8px'>
        Hábitos
      </Text>
      <SimpleGrid columns={2} gap='8px' mb='12px'>
        {[
          { key: 'tabaquismo', label: 'Tabaquismo' },
          { key: 'alcoholismo', label: 'Alcoholismo' },
          { key: 'drogas', label: 'Drogas' },
          { key: 'cafe', label: 'Café' },
          { key: 'actividadFisica', label: 'Actividad Física' },
        ].map(({ key, label }) => (
          <Controller
            key={key}
            name={key as keyof NPForm}
            control={control}
            render={({ field: { onChange, value } }) => (
              <Checkbox
                isChecked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                size='sm'
                colorScheme='brand'>
                <Text fontSize='sm'>{label}</Text>
              </Checkbox>
            )}
          />
        ))}
      </SimpleGrid>

      {hasTabaquismo && (
        <Flex gap='8px' mb='8px'>
          <Controller
            name='tabaquismoTipo'
            control={control}
            render={({ field }) => (
              <Select {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' flex={1}>
                <option value=''>Tipo...</option>
                <option value='FUMADOR_ACTIVO'>Activo</option>
                <option value='EX_FUMADOR'>Ex-fumador</option>
              </Select>
            )}
          />
          <Controller
            name='tabaquismoCigarrillosDia'
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                type='number'
                size='sm'
                bg={inputBg}
                borderRadius='8px'
                placeholder='Cig/día'
                w='90px'
              />
            )}
          />
        </Flex>
      )}

      {hasAlcohol && (
        <Controller
          name='alcoholismoFrecuencia'
          control={control}
          render={({ field }) => (
            <Select {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' mb='8px'>
              <option value=''>Frecuencia alcohol...</option>
              <option value='DIARIO'>Diario</option>
              <option value='SEMANAL'>Semanal</option>
              <option value='MENSUAL'>Mensual</option>
              <option value='OCASIONAL'>Ocasional</option>
            </Select>
          )}
        />
      )}

      {hasDrogas && (
        <Controller
          name='drogasTipo'
          control={control}
          render={({ field }) => (
            <Input {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' mb='8px' placeholder='Tipo de droga...' />
          )}
        />
      )}

      {hasCafe && (
        <Controller
          name='cafeTazasDia'
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
              type='number'
              size='sm'
              bg={inputBg}
              borderRadius='8px'
              mb='8px'
              placeholder='Tazas/día'
            />
          )}
        />
      )}

      {hasActividad && (
        <Flex gap='8px' mb='8px'>
          <Controller
            name='actividadFisicaTipo'
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' flex={1} placeholder='Tipo actividad...' />
            )}
          />
          <Controller
            name='actividadFisicaFrecuencia'
            control={control}
            render={({ field }) => (
              <Select {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' w='130px'>
                <option value=''>Frecuencia...</option>
                <option value='DIARIA'>Diaria</option>
                <option value='SEMANAL'>Semanal</option>
                <option value='MENSUAL'>Mensual</option>
                <option value='RARA_VEZ'>Rara vez</option>
              </Select>
            )}
          />
        </Flex>
      )}

      <Text fontSize='11px' color={labelColor} fontWeight='700' textTransform='uppercase' letterSpacing='wider' mb='8px' mt='4px'>
        Alimentación y sueño
      </Text>
      <Flex gap='8px' mb='8px'>
        <Controller
          name='alimentacionTipo'
          control={control}
          render={({ field }) => (
            <Select {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' flex={1}>
              <option value=''>Tipo dieta...</option>
              <option value='OMNIVORA'>Omnívora</option>
              <option value='VEGETARIANA'>Vegetariana</option>
              <option value='VEGANA'>Vegana</option>
              <option value='OTRA'>Otra</option>
            </Select>
          )}
        />
        <Controller
          name='alimentacionComidasDia'
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              type='number'
              size='sm'
              bg={inputBg}
              borderRadius='8px'
              placeholder='Comidas/día'
              w='110px'
            />
          )}
        />
      </Flex>

      <Flex gap='8px' mb='12px'>
        <Controller
          name='horasSuenoPromedio'
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
              type='number'
              size='sm'
              bg={inputBg}
              borderRadius='8px'
              flex={1}
              placeholder='Horas sueño'
            />
          )}
        />
        <Controller
          name='calidadSueno'
          control={control}
          render={({ field }) => (
            <Select {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' flex={1}>
              <option value=''>Calidad sueño...</option>
              <option value='EXCELENTE'>Excelente</option>
              <option value='BUENA'>Buena</option>
              <option value='REGULAR'>Regular</option>
              <option value='MALA'>Mala</option>
            </Select>
          )}
        />
      </Flex>

      <Controller
        name='esquemaVacunacionCompleto'
        control={control}
        render={({ field: { onChange, value } }) => (
          <Checkbox
            isChecked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            size='sm'
            colorScheme='brand'
            mb='12px'>
            <Text fontSize='sm'>Esquema de vacunación completo</Text>
          </Checkbox>
        )}
      />

      <Button
        type='submit'
        size='sm'
        variant='brand'
        w='100%'
        isLoading={update.isPending}
        leftIcon={<Icon as={MdSave} />}>
        Guardar
      </Button>
    </form>
  );
}

// ─── Gineco form ─────────────────────────────────────────────────────────────

type GForm = Pick<
  AntecedentesGineco,
  | 'menarcaEdad' | 'fechaUltimaMenstruacion' | 'cicloMenstrualRegular'
  | 'cicloMenstrualDuracionDias' | 'dismenorrea' | 'dismenorreaIntensidad'
  | 'menopausia' | 'menopausiaEdad'
  | 'metodoAnticonceptivoActual'
  | 'gestas' | 'partos' | 'cesareas' | 'abortos' | 'hijosVivos'
  | 'embarazoActual' | 'embarazoActualSemanas'
  | 'citologiaUltimaFecha' | 'citologiaResultado'
>;

function GinecoForm({ patientId }: { patientId: string }) {
  const { data, isLoading } = useGineco(patientId);
  const update = useUpdateGineco(patientId);
  const toast = useToast();
  const inputBg = useColorModeValue('gray.50', 'navy.700');
  const labelColor = useColorModeValue('secondaryGray.700', 'secondaryGray.300');

  const { control, handleSubmit, reset, watch } = useForm<GForm>({
    defaultValues: {
      gestas: 0, partos: 0, cesareas: 0, abortos: 0, hijosVivos: 0,
      cicloMenstrualDuracionDias: 28, dismenorrea: false,
      menopausia: false, embarazoActual: false,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        menarcaEdad: data.menarcaEdad ?? null,
        fechaUltimaMenstruacion: data.fechaUltimaMenstruacion ?? '',
        cicloMenstrualRegular: data.cicloMenstrualRegular ?? false,
        cicloMenstrualDuracionDias: data.cicloMenstrualDuracionDias ?? 28,
        dismenorrea: data.dismenorrea ?? false,
        dismenorreaIntensidad: data.dismenorreaIntensidad ?? '',
        menopausia: data.menopausia ?? false,
        menopausiaEdad: data.menopausiaEdad ?? null,
        metodoAnticonceptivoActual: data.metodoAnticonceptivoActual ?? '',
        gestas: data.gestas ?? 0,
        partos: data.partos ?? 0,
        cesareas: data.cesareas ?? 0,
        abortos: data.abortos ?? 0,
        hijosVivos: data.hijosVivos ?? 0,
        embarazoActual: data.embarazoActual ?? false,
        embarazoActualSemanas: data.embarazoActualSemanas ?? null,
        citologiaUltimaFecha: data.citologiaUltimaFecha ?? '',
        citologiaResultado: data.citologiaResultado ?? '',
      });
    }
  }, [data, reset]);

  if (isLoading) return <Skeleton h='200px' borderRadius='12px' />;

  const onSubmit = async (values: GForm) => {
    try {
      await update.mutateAsync({
        menarcaEdad: values.menarcaEdad ?? null,
        fechaUltimaMenstruacion: values.fechaUltimaMenstruacion || null,
        cicloMenstrualRegular: values.cicloMenstrualRegular,
        cicloMenstrualDuracionDias: values.cicloMenstrualDuracionDias,
        dismenorrea: values.dismenorrea,
        dismenorreaIntensidad: values.dismenorreaIntensidad || null,
        menopausia: values.menopausia,
        menopausiaEdad: values.menopausiaEdad ?? null,
        metodoAnticonceptivoActual: values.metodoAnticonceptivoActual || null,
        gestas: values.gestas,
        partos: values.partos,
        cesareas: values.cesareas,
        abortos: values.abortos,
        hijosVivos: values.hijosVivos,
        embarazoActual: values.embarazoActual,
        embarazoActualSemanas: values.embarazoActualSemanas ?? null,
        citologiaUltimaFecha: values.citologiaUltimaFecha || null,
        citologiaResultado: values.citologiaResultado || null,
      });
      toast({ title: 'Guardado', status: 'success', duration: 2000, position: 'top-right' });
    } catch {
      toast({ title: 'Error al guardar', status: 'error', duration: 3000, position: 'top-right' });
    }
  };

  const hasMenopausia = watch('menopausia');
  const hasEmbarazo = watch('embarazoActual');
  const hasDismenorrea = watch('dismenorrea');

  const numInput = (name: keyof GForm, placeholder: string, w?: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, ...rest } }) => (
        <Input
          {...rest}
          value={value != null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          type='number'
          size='sm'
          bg={inputBg}
          borderRadius='8px'
          placeholder={placeholder}
          w={w}
        />
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Text fontSize='11px' color={labelColor} fontWeight='700' textTransform='uppercase' letterSpacing='wider' mb='8px'>
        Menstruación
      </Text>
      <SimpleGrid columns={2} gap='8px' mb='8px'>
        {numInput('menarcaEdad', 'Menarca (edad)')}
        {numInput('cicloMenstrualDuracionDias', 'Duración ciclo (días)')}
        <Controller
          name='fechaUltimaMenstruacion'
          control={control}
          render={({ field }) => (
            <Input {...field} value={field.value ?? ''} type='date' size='sm' bg={inputBg} borderRadius='8px' />
          )}
        />
        <Controller
          name='cicloMenstrualRegular'
          control={control}
          render={({ field: { onChange, value } }) => (
            <Checkbox isChecked={!!value} onChange={(e) => onChange(e.target.checked)} size='sm' colorScheme='brand'>
              <Text fontSize='sm'>Ciclo regular</Text>
            </Checkbox>
          )}
        />
      </SimpleGrid>

      <Controller
        name='dismenorrea'
        control={control}
        render={({ field: { onChange, value } }) => (
          <Checkbox isChecked={!!value} onChange={(e) => onChange(e.target.checked)} size='sm' colorScheme='brand' mb='8px'>
            <Text fontSize='sm'>Dismenorrea</Text>
          </Checkbox>
        )}
      />

      {hasDismenorrea && (
        <Controller
          name='dismenorreaIntensidad'
          control={control}
          render={({ field }) => (
            <Select {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' mb='8px'>
              <option value=''>Intensidad...</option>
              <option value='LEVE'>Leve</option>
              <option value='MODERADA'>Moderada</option>
              <option value='SEVERA'>Severa</option>
            </Select>
          )}
        />
      )}

      <Controller
        name='menopausia'
        control={control}
        render={({ field: { onChange, value } }) => (
          <Checkbox isChecked={!!value} onChange={(e) => onChange(e.target.checked)} size='sm' colorScheme='brand' mb='8px'>
            <Text fontSize='sm'>Menopausia</Text>
          </Checkbox>
        )}
      />

      {hasMenopausia && numInput('menopausiaEdad', 'Edad menopausia')}

      <Text fontSize='11px' color={labelColor} fontWeight='700' textTransform='uppercase' letterSpacing='wider' mb='8px' mt='4px'>
        Fórmula obstétrica
      </Text>
      <SimpleGrid columns={5} gap='6px' mb='8px'>
        {([
          { key: 'gestas', label: 'G' },
          { key: 'partos', label: 'P' },
          { key: 'cesareas', label: 'C' },
          { key: 'abortos', label: 'A' },
          { key: 'hijosVivos', label: 'HV' },
        ] as { key: keyof GForm; label: string }[]).map(({ key, label }) => (
          <Controller
            key={key}
            name={key}
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <FormControl>
                <FormLabel fontSize='10px' fontWeight='700' mb='2px' textAlign='center'>{label}</FormLabel>
                <Input
                  {...rest}
                  value={value != null ? Number(value) : 0}
                  onChange={(e) => onChange(Number(e.target.value))}
                  type='number'
                  size='sm'
                  bg={inputBg}
                  borderRadius='8px'
                  textAlign='center'
                  px='6px'
                />
              </FormControl>
            )}
          />
        ))}
      </SimpleGrid>

      <Controller
        name='embarazoActual'
        control={control}
        render={({ field: { onChange, value } }) => (
          <Checkbox isChecked={!!value} onChange={(e) => onChange(e.target.checked)} size='sm' colorScheme='brand' mb='8px'>
            <Text fontSize='sm'>Embarazo actual</Text>
          </Checkbox>
        )}
      />

      {hasEmbarazo && numInput('embarazoActualSemanas', 'Semanas gestación')}

      <Text fontSize='11px' color={labelColor} fontWeight='700' textTransform='uppercase' letterSpacing='wider' mb='8px' mt='4px'>
        Anticonceptivo y citología
      </Text>
      <Controller
        name='metodoAnticonceptivoActual'
        control={control}
        render={({ field }) => (
          <Input {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' mb='8px' placeholder='Método anticonceptivo actual...' />
        )}
      />
      <Flex gap='8px' mb='12px'>
        <Controller
          name='citologiaUltimaFecha'
          control={control}
          render={({ field }) => (
            <Input {...field} value={field.value ?? ''} type='date' size='sm' bg={inputBg} borderRadius='8px' flex={1} />
          )}
        />
        <Controller
          name='citologiaResultado'
          control={control}
          render={({ field }) => (
            <Select {...field} value={field.value ?? ''} size='sm' bg={inputBg} borderRadius='8px' flex={1}>
              <option value=''>Resultado citología...</option>
              <option value='NORMAL'>Normal</option>
              <option value='ANORMAL'>Anormal</option>
              <option value='PENDIENTE'>Pendiente</option>
            </Select>
          )}
        />
      </Flex>

      <Button
        type='submit'
        size='sm'
        variant='brand'
        w='100%'
        isLoading={update.isPending}
        leftIcon={<Icon as={MdSave} />}>
        Guardar
      </Button>
    </form>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

interface AntecedentesPanelProps {
  patient: Patient;
  resumen: AntecedentesCompletos | undefined;
}

interface SectionConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  record: object | null | undefined;
  form: React.ReactNode;
  gineco?: boolean;
}

export default function AntecedentesPanel({ patient, resumen }: AntecedentesPanelProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const headerBg = useColorModeValue('gray.50', 'navy.700');
  const hoverBg = useColorModeValue('gray.100', 'navy.600');
  const isFemenino = patient.genero === Genero.FEMENINO;

  // Prefetch todos los tipos al montar → cache caliente antes de abrir accordion
  useHeredofamiliares(patient.id);
  usePatologicos(patient.id);
  useNoPatologicos(patient.id);
  useGineco(patient.id, isFemenino);

  const sections: SectionConfig[] = [
    {
      key: 'hf',
      label: 'Heredo-familiares',
      icon: MdFamilyRestroom,
      color: 'blue.400',
      record: resumen?.heredofamiliares,
      form: <HeredofamiliarForm patientId={patient.id} />,
    },
    {
      key: 'pat',
      label: 'Patológicos',
      icon: MdLocalHospital,
      color: 'red.400',
      record: resumen?.patologicos,
      form: <PatologicoForm patientId={patient.id} />,
    },
    {
      key: 'np',
      label: 'No patológicos',
      icon: MdSelfImprovement,
      color: 'green.400',
      record: resumen?.noPatologicos,
      form: <NoPatologicoForm patientId={patient.id} />,
    },
    ...(isFemenino
      ? [{
          key: 'gineco',
          label: 'Gineco-obstétricos',
          icon: MdFemale,
          color: 'pink.400',
          record: resumen?.ginecoObstetricos,
          form: <GinecoForm patientId={patient.id} />,
          gineco: true,
        }]
      : []),
  ];

  return (
    <Card p='20px'>
      <Text color={textColor} fontSize='sm' fontWeight='800' mb='14px'>
        Antecedentes Clínicos
      </Text>

      <Accordion
        allowMultiple
        onChange={(idxs) => setOpenIndexes(idxs as number[])}>
        {sections.map((section, idx) => (
          <AccordionItem
            key={section.key}
            border='none'
            mb='6px'>
            <AccordionButton
              bg={headerBg}
              borderRadius='10px'
              px='12px'
              py='10px'
              _hover={{ bg: hoverBg }}
              _expanded={{ borderBottomRadius: 0 }}>
              <Flex flex={1} align='center' gap='8px'>
                <Box
                  w='28px'
                  h='28px'
                  borderRadius='8px'
                  bg={`${section.color.split('.')[0]}.50`}
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  flexShrink={0}>
                  <Icon as={section.icon} color={section.color} w='14px' h='14px' />
                </Box>
                <Flex direction='column' align='flex-start' flex={1} minW={0}>
                  <Text fontSize='sm' fontWeight='700' color={textColor} noOfLines={1}>
                    {section.label}
                  </Text>
                  <CompletionBadge record={section.record ?? null} />
                </Flex>
              </Flex>
              <AccordionIcon color='secondaryGray.500' />
            </AccordionButton>

            <AccordionPanel
              bg={headerBg}
              borderBottomRadius='10px'
              px='12px'
              pb='12px'
              pt='10px'>
              {openIndexes.includes(idx) ? section.form : null}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}

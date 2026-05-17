import {
  Button, FormControl, FormLabel, FormErrorMessage, Input,
  Select, SimpleGrid, Box, Textarea, InputGroup, InputRightElement,
  Icon, Text,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { MdWarning } from 'react-icons/md';
import { patientSchema, PatientFormValues, PROVINCIAS_ECUADOR } from 'schemas/patientSchema';
import { Genero, EstadoCivil, Patient } from 'types/models';

interface PatientFormProps {
  patient?: Patient | null;
  isLoading: boolean;
  onSubmit: (values: PatientFormValues) => void;
  onCancel: () => void;
}

export default function PatientForm({ patient, isLoading, onSubmit, onCancel }: PatientFormProps) {
  const isEditing = !!patient;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<PatientFormValues>({
    resolver: yupResolver(patientSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      cedula: '',
      nombres: '',
      apellidos: '',
      fechaNacimiento: '',
      genero: Genero.MASCULINO,
      email: '',
      telefono: '',
      telefonoEmergencia: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      ocupacion: '',
      estadoCivil: undefined,
    },
  });

  useEffect(() => {
    if (patient) {
      reset({
        cedula: patient.cedula,
        nombres: patient.nombres,
        apellidos: patient.apellidos,
        fechaNacimiento: patient.fechaNacimiento.slice(0, 10),
        genero: patient.genero,
        email: patient.email ?? '',
        telefono: patient.telefono ?? '',
        telefonoEmergencia: patient.telefonoEmergencia ?? '',
        direccion: patient.direccion ?? '',
        ciudad: patient.ciudad ?? '',
        provincia: patient.provincia ?? '',
        codigoPostal: patient.codigoPostal ?? '',
        ocupacion: patient.ocupacion ?? '',
        estadoCivil: patient.estadoCivil ?? undefined,
      });
    } else {
      reset();
    }
  }, [patient, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <SimpleGrid columns={2} gap='16px' mb='8px'>

        <FormControl isRequired isInvalid={!!errors.cedula}>
          <FormLabel fontSize='sm'>Cédula</FormLabel>
          <Input {...register('cedula')} placeholder='1713175071' isDisabled={isEditing} />
          <FormErrorMessage>{errors.cedula?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.nombres}>
          <FormLabel fontSize='sm'>Nombres</FormLabel>
          <Input {...register('nombres')} placeholder='Juan Carlos' />
          <FormErrorMessage>{errors.nombres?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.apellidos}>
          <FormLabel fontSize='sm'>Apellidos</FormLabel>
          <Input {...register('apellidos')} placeholder='Rodríguez Pérez' />
          <FormErrorMessage>{errors.apellidos?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.fechaNacimiento}>
          <FormLabel fontSize='sm'>Fecha de Nacimiento</FormLabel>
          <Input type='date' {...register('fechaNacimiento')} />
          <FormErrorMessage>{errors.fechaNacimiento?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.genero}>
          <FormLabel fontSize='sm'>Género</FormLabel>
          <Select {...register('genero')}>
            <option value={Genero.MASCULINO}>Masculino</option>
            <option value={Genero.FEMENINO}>Femenino</option>
            <option value={Genero.OTRO}>Otro</option>
          </Select>
          <FormErrorMessage>{errors.genero?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.estadoCivil}>
          <FormLabel fontSize='sm'>Estado Civil</FormLabel>
          <Select {...register('estadoCivil')}>
            <option value=''>— Seleccionar —</option>
            <option value={EstadoCivil.SOLTERO}>Soltero/a</option>
            <option value={EstadoCivil.CASADO}>Casado/a</option>
            <option value={EstadoCivil.DIVORCIADO}>Divorciado/a</option>
            <option value={EstadoCivil.VIUDO}>Viudo/a</option>
            <option value={EstadoCivil.UNION_LIBRE}>Unión Libre</option>
          </Select>
          <FormErrorMessage>{errors.estadoCivil?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.email}>
          <FormLabel fontSize='sm'>
            Email{' '}
            <Text as='span' color='gray.400' fontWeight='normal' fontSize='xs'>(opcional)</Text>
          </FormLabel>
          <Input type='email' {...register('email')} placeholder='juan@email.com' />
          <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.telefono}>
          <FormLabel fontSize='sm'>
            Teléfono{' '}
            <Text as='span' color='gray.400' fontWeight='normal' fontSize='xs'>(opcional)</Text>
          </FormLabel>
          <InputGroup>
            <Input {...register('telefono')} placeholder='0991234567' />
            {errors.telefono && (
              <InputRightElement>
                <Icon as={MdWarning} color='red.400' />
              </InputRightElement>
            )}
          </InputGroup>
          <FormErrorMessage>{errors.telefono?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.telefonoEmergencia}>
          <FormLabel fontSize='sm'>
            Tel. Emergencia{' '}
            <Text as='span' color='gray.400' fontWeight='normal' fontSize='xs'>(opcional)</Text>
          </FormLabel>
          <InputGroup>
            <Input {...register('telefonoEmergencia')} placeholder='0987654321' />
            {errors.telefonoEmergencia && (
              <InputRightElement>
                <Icon as={MdWarning} color='red.400' />
              </InputRightElement>
            )}
          </InputGroup>
          <FormErrorMessage>{errors.telefonoEmergencia?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.ocupacion}>
          <FormLabel fontSize='sm'>
            Ocupación{' '}
            <Text as='span' color='gray.400' fontWeight='normal' fontSize='xs'>(opcional)</Text>
          </FormLabel>
          <Input {...register('ocupacion')} placeholder='Ingeniero' />
          <FormErrorMessage>{errors.ocupacion?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.ciudad}>
          <FormLabel fontSize='sm'>
            Ciudad{' '}
            <Text as='span' color='gray.400' fontWeight='normal' fontSize='xs'>(opcional)</Text>
          </FormLabel>
          <Input {...register('ciudad')} placeholder='Quito' />
          <FormErrorMessage>{errors.ciudad?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.provincia}>
          <FormLabel fontSize='sm'>
            Provincia{' '}
            <Text as='span' color='gray.400' fontWeight='normal' fontSize='xs'>(opcional)</Text>
          </FormLabel>
          <Select {...register('provincia')}>
            <option value=''>— Seleccionar —</option>
            {PROVINCIAS_ECUADOR.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
          <FormErrorMessage>{errors.provincia?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.codigoPostal}>
          <FormLabel fontSize='sm'>
            Código Postal{' '}
            <Text as='span' color='gray.400' fontWeight='normal' fontSize='xs'>(opcional)</Text>
          </FormLabel>
          <Input {...register('codigoPostal')} placeholder='170150' />
          <FormErrorMessage>{errors.codigoPostal?.message}</FormErrorMessage>
        </FormControl>

        <Box gridColumn='span 2'>
          <FormControl isInvalid={!!errors.direccion}>
            <FormLabel fontSize='sm'>
              Dirección{' '}
              <Text as='span' color='gray.400' fontWeight='normal' fontSize='xs'>(opcional)</Text>
            </FormLabel>
            <Textarea {...register('direccion')} placeholder='Av. 6 de Diciembre N24-567'
              rows={2} resize='none' />
            <FormErrorMessage>{errors.direccion?.message}</FormErrorMessage>
          </FormControl>
        </Box>

      </SimpleGrid>

      <Box display='flex' justifyContent='flex-end' gap='8px' pt='8px'>
        <Button variant='ghost' onClick={onCancel} isDisabled={isLoading}>
          Cancelar
        </Button>
        <Button
          type='submit'
          colorScheme='brand'
          isLoading={isLoading}
          isDisabled={!isValid || (!isDirty && isEditing) || isLoading}
          loadingText='Guardando...'
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Paciente'}
        </Button>
      </Box>
    </form>
  );
}

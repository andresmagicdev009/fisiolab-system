import {
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import FormField from 'components/ui/FormField';
import Button from 'components/ui/Button';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { MdPerson } from 'react-icons/md';
import { CreatePatientData, EstadoCivil, Genero, Patient } from 'types/models';
import * as yup from 'yup';

function validarCedulaEcuatoriana(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;
  if (parseInt(cedula[2], 10) >= 6) return false;
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const suma = coeficientes.reduce((acc, coef, i) => {
    let val = coef * parseInt(cedula[i], 10);
    if (val >= 10) val -= 9;
    return acc + val;
  }, 0);
  const digitoVerificador = (10 - (suma % 10)) % 10;
  return digitoVerificador === parseInt(cedula[9], 10);
}

// Ecuador: móvil 09XXXXXXXX | fijo 0[2-7]XXXXXXX
const REGEX_TELEFONO_EC = /^(09\d{8}|0[2-7]\d{7})$/;
const REGEX_EMAIL = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const REGEX_SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
const REGEX_CODIGO_POSTAL = /^\d{4,6}$/;

const schema = yup.object({
  cedula: yup
    .string()
    .required('Cédula requerida')
    .matches(/^\d{10}$/, 'Debe tener exactamente 10 dígitos')
    .test('cedula-ec', 'Cédula ecuatoriana inválida', validarCedulaEcuatoriana),
  nombres: yup
    .string()
    .required('Nombres requeridos')
    .min(2, 'Mínimo 2 caracteres')
    .max(60, 'Máximo 60 caracteres')
    .matches(REGEX_SOLO_LETRAS, 'Solo letras y espacios'),
  apellidos: yup
    .string()
    .required('Apellidos requeridos')
    .min(2, 'Mínimo 2 caracteres')
    .max(60, 'Máximo 60 caracteres')
    .matches(REGEX_SOLO_LETRAS, 'Solo letras y espacios'),
  fechaNacimiento: yup
    .string()
    .required('Fecha de nacimiento requerida')
    .test('fecha-valida', 'Fecha inválida', (val) => {
      if (!val) return false;
      const fecha = new Date(val);
      const hoy = new Date();
      return fecha < hoy && fecha.getFullYear() >= 1900;
    })
    .test('mayor-edad-minima', 'El paciente debe tener al menos 0 años', (val) => {
      if (!val) return false;
      return new Date(val) <= new Date();
    }),
  genero: yup
    .string()
    .oneOf(Object.values(Genero), 'Género inválido')
    .required('Género requerido'),
  email: yup
    .string()
    .optional()
    .test('email-valido', 'Correo electrónico inválido', (val) => {
      if (!val || val === '') return true;
      return REGEX_EMAIL.test(val);
    }),
  telefono: yup
    .string()
    .optional()
    .test('telefono-valido', 'Teléfono inválido (ej: 0991234567 o 022345678)', (val) => {
      if (!val || val === '') return true;
      return REGEX_TELEFONO_EC.test(val);
    }),
  telefonoEmergencia: yup
    .string()
    .optional()
    .test('tel-emergencia-valido', 'Teléfono inválido (ej: 0991234567 o 022345678)', (val) => {
      if (!val || val === '') return true;
      return REGEX_TELEFONO_EC.test(val);
    }),
  direccion: yup.string().optional().max(150, 'Máximo 150 caracteres'),
  ciudad: yup
    .string()
    .optional()
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]*$/, 'Solo letras y espacios'),
  provincia: yup
    .string()
    .optional()
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]*$/, 'Solo letras y espacios'),
  codigoPostal: yup
    .string()
    .optional()
    .test('cp-valido', 'Código postal inválido (4-6 dígitos)', (val) => {
      if (!val || val === '') return true;
      return REGEX_CODIGO_POSTAL.test(val);
    }),
  ocupacion: yup.string().optional().max(80, 'Máximo 80 caracteres'),
  estadoCivil: yup.string().optional(),
});

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePatientData) => Promise<void>;
  patient?: Patient | null;
}

export default function PatientModal({
  isOpen,
  onClose,
  onSave,
  patient,
}: PatientModalProps) {
  const isEditing = !!patient;
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const sectionColor = useColorModeValue('brand.500', 'brand.400');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePatientData>({
    resolver: yupResolver(schema) as any,
  });

  useEffect(() => {
    if (patient) {
      reset({
        cedula: patient.cedula,
        nombres: patient.nombres,
        apellidos: patient.apellidos,
        fechaNacimiento: patient.fechaNacimiento,
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
      reset({
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
      });
    }
  }, [patient, isOpen, reset]);

  const onSubmit = async (data: CreatePatientData) => {
    try {
      await onSave(data);
      toast({
        title: isEditing ? 'Paciente actualizado' : 'Paciente registrado',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        status === 409
          ? 'La cédula o email ya está registrado'
          : status === 400
          ? 'Datos inválidos. Revise el formulario'
          : err?.response?.data?.message ?? 'Error al guardar. Intente nuevamente';
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='2xl' scrollBehavior='inside'>
      <ModalOverlay backdropFilter='blur(4px)' bg='blackAlpha.400' />
      <ModalContent bg={bgColor} borderRadius='20px' mx='4'>
        <ModalHeader pb='0'>
          <Flex align='center' gap='3'>
            <Flex
              w='40px'
              h='40px'
              bg='brand.500'
              borderRadius='12px'
              align='center'
              justify='center'
              flexShrink={0}>
              <Icon as={MdPerson} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>
                {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
              </Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {isEditing
                  ? 'Modifica los datos del paciente'
                  : 'Completa los datos para registrar al paciente'}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          <form id='patient-form' onSubmit={handleSubmit(onSubmit)}>
            {/* Información Personal */}
            <Text
              color={sectionColor}
              fontSize='xs'
              fontWeight='800'
              textTransform='uppercase'
              letterSpacing='wider'
              mb='16px'>
              Información Personal
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap='16px'>
              <FormField
                id='cedula'
                label='Cédula / Documento'
                placeholder='1234567890'
                mb='0'
                isInvalid={!!errors.cedula}
                errorMessage={errors.cedula?.message}
                {...register('cedula')}
              />
              <FormControl mb='0' isInvalid={!!errors.genero}>
                <FormLabel
                  ms='10px'
                  fontSize='sm'
                  color={textColor}
                  fontWeight='bold'
                  htmlFor='genero'>
                  Género
                </FormLabel>
                <Select id='genero' h='44px' variant='main' {...register('genero')}>
                  <option value={Genero.MASCULINO}>Masculino</option>
                  <option value={Genero.FEMENINO}>Femenino</option>
                  <option value={Genero.OTRO}>Otro</option>
                </Select>
                <FormErrorMessage ms='10px'>{errors.genero?.message}</FormErrorMessage>
              </FormControl>
              <FormField
                id='nombres'
                label='Nombres'
                placeholder='Juan Carlos'
                mb='0'
                isInvalid={!!errors.nombres}
                errorMessage={errors.nombres?.message}
                {...register('nombres')}
              />
              <FormField
                id='apellidos'
                label='Apellidos'
                placeholder='García López'
                mb='0'
                isInvalid={!!errors.apellidos}
                errorMessage={errors.apellidos?.message}
                {...register('apellidos')}
              />
              <FormField
                id='fechaNacimiento'
                label='Fecha de Nacimiento'
                type='date'
                mb='0'
                isInvalid={!!errors.fechaNacimiento}
                errorMessage={errors.fechaNacimiento?.message}
                {...register('fechaNacimiento')}
              />
              <FormField
                id='email'
                label='Email'
                type='email'
                placeholder='paciente@email.com'
                mb='0'
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
                {...register('email')}
              />
            </SimpleGrid>

            <Divider my='20px' />

            {/* Contacto */}
            <Text
              color={sectionColor}
              fontSize='xs'
              fontWeight='800'
              textTransform='uppercase'
              letterSpacing='wider'
              mb='16px'>
              Contacto
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap='16px'>
              <FormField
                id='telefono'
                label='Teléfono'
                placeholder='0991234567'
                mb='0'
                {...register('telefono')}
              />
              <FormField
                id='telefonoEmergencia'
                label='Teléfono de Emergencia'
                placeholder='0991234567'
                mb='0'
                {...register('telefonoEmergencia')}
              />
              <FormField
                id='direccion'
                label='Dirección'
                placeholder='Calle Principal 123'
                mb='0'
                {...register('direccion')}
              />
              <FormField
                id='ciudad'
                label='Ciudad'
                placeholder='Quito'
                mb='0'
                {...register('ciudad')}
              />
              <FormField
                id='provincia'
                label='Provincia'
                placeholder='Pichincha'
                mb='0'
                {...register('provincia')}
              />
              <FormField
                id='codigoPostal'
                label='Código Postal'
                placeholder='170150'
                mb='0'
                {...register('codigoPostal')}
              />
            </SimpleGrid>

            <Divider my='20px' />

            {/* Información Adicional */}
            <Text
              color={sectionColor}
              fontSize='xs'
              fontWeight='800'
              textTransform='uppercase'
              letterSpacing='wider'
              mb='16px'>
              Información Adicional
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap='16px'>
              <FormField
                id='ocupacion'
                label='Ocupación'
                placeholder='Ingeniero, Docente...'
                mb='0'
                {...register('ocupacion')}
              />
              <FormControl mb='0'>
                <FormLabel
                  ms='10px'
                  fontSize='sm'
                  color={textColor}
                  fontWeight='bold'
                  htmlFor='estadoCivil'>
                  Estado Civil
                </FormLabel>
                <Select id='estadoCivil' h='44px' variant='main' {...register('estadoCivil')}>
                  <option value=''>Seleccionar...</option>
                  <option value={EstadoCivil.SOLTERO}>Soltero/a</option>
                  <option value={EstadoCivil.CASADO}>Casado/a</option>
                  <option value={EstadoCivil.DIVORCIADO}>Divorciado/a</option>
                  <option value={EstadoCivil.VIUDO}>Viudo/a</option>
                  <option value={EstadoCivil.UNION_LIBRE}>Unión Libre</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type='submit'
            form='patient-form'
            isLoading={isSubmitting}
            leftIcon={<Icon as={MdPerson} />}>
            {isEditing ? 'Actualizar' : 'Registrar Paciente'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import {
  Alert,
  AlertIcon,
  Box,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useUser } from '@clerk/clerk-react';
import IconBox from 'components/icons/IconBox';
import MiniStatistics from 'components/card/MiniStatistics';
import Button from 'components/ui/Button';
import {
  useCreatePatient,
  useDeletePatient,
  usePatients,
  useUpdatePatient,
} from 'hooks/usePatients';
import PatientModal from 'layouts/patients/PatientModal';
import PatientTable from 'layouts/patients/PatientTable';
import React, { useMemo, useState } from 'react';
import { MdFemale, MdMale, MdPeople, MdPersonAdd, MdSearch } from 'react-icons/md';
import { tarjeteroService } from 'services/tarjeteroService';
import { getUserRole } from 'utils/auth';
import { CreatePatientData, Genero, Patient } from 'types/models';

export default function PatientsView() {
  const { user } = useUser();
  const role = getUserRole(user) ?? '';
  const toast = useToast();

  const canWrite = ['admin', 'medico', 'fisioterapeuta'].includes(role);
  const canDelete = role === 'admin';

  const { data: patients = [], isLoading, isError } = usePatients();
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const inputBg = useColorModeValue('white', 'navy.700');
  const inputBorder = useColorModeValue('secondaryGray.100', 'whiteAlpha.100');

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        p.cedula.includes(q) ||
        (p.email?.toLowerCase().includes(q) ?? false) ||
        (p.ciudad?.toLowerCase().includes(q) ?? false)
    );
  }, [patients, searchQuery]);

  const handleOpenAdd = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Paciente eliminado',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (err: any) {
      toast({
        title: 'Error al eliminar',
        description: err?.response?.data?.message ?? 'Intente nuevamente',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  const handleSave = async (data: CreatePatientData) => {
    if (selectedPatient) {
      await updateMutation.mutateAsync({ id: selectedPatient.id, payload: data });
    } else {
      const newPatient = await createMutation.mutateAsync(data);
      // BPMN onboarding: auto-crear tarjetero índice tras registro de paciente
      try {
        await tarjeteroService.create(newPatient.id, {});
      } catch (err: any) {
        // 409 = ya existe (no debería ocurrir en primer registro, pero es idempotente)
        if (err?.response?.status !== 409) {
          toast({
            title: 'Paciente creado',
            description: 'No se pudo generar el código HC. Ábralo desde el perfil del paciente.',
            status: 'warning',
            duration: 6000,
            isClosable: true,
            position: 'top-right',
          });
        }
      }
    }
  };

  const totalMujeres = patients.filter((p) => p.genero === Genero.FEMENINO).length;
  const totalHombres = patients.filter((p) => p.genero === Genero.MASCULINO).length;

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap='20px' mb='20px'>
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdPeople} color={brandColor} />}
            />
          }
          name='Total Pacientes'
          value={isLoading ? '—' : String(patients.length)}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg='pink.100'
              icon={<Icon w='32px' h='32px' as={MdFemale} color='pink.500' />}
            />
          }
          name='Mujeres'
          value={isLoading ? '—' : String(totalMujeres)}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg='blue.50'
              icon={<Icon w='32px' h='32px' as={MdMale} color='blue.500' />}
            />
          }
          name='Hombres'
          value={isLoading ? '—' : String(totalHombres)}
        />
      </SimpleGrid>

      {/* Header */}
      <Flex justify='space-between' align='center' mb='20px' flexWrap='wrap' gap='12px'>
        <Flex direction='column'>
          <Text color={textColor} fontSize='2xl' fontWeight='800'>
            Gestión de Pacientes
          </Text>
          <Text color='secondaryGray.600' fontSize='sm'>
            {filteredPatients.length} paciente
            {filteredPatients.length !== 1 ? 's' : ''} encontrado
            {filteredPatients.length !== 1 ? 's' : ''}
          </Text>
        </Flex>
        <Flex gap='12px' align='center' flexWrap='wrap'>
          <InputGroup w={{ base: 'full', md: '280px' }}>
            <InputLeftElement pointerEvents='none' h='44px'>
              <Icon as={MdSearch} color='secondaryGray.600' w='18px' h='18px' />
            </InputLeftElement>
            <Input
              pl='44px'
              h='44px'
              bg={inputBg}
              border='1px solid'
              borderColor={inputBorder}
              borderRadius='16px'
              fontSize='sm'
              placeholder='Buscar paciente...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
              }}
            />
          </InputGroup>
          {canWrite && (
            <Button leftIcon={<Icon as={MdPersonAdd} />} onClick={handleOpenAdd}>
              Nuevo Paciente
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Error */}
      {isError && (
        <Alert status='error' borderRadius='16px' mb='20px'>
          <AlertIcon />
          Error al cargar pacientes. Verifique su conexión e intente nuevamente.
        </Alert>
      )}

      {/* Skeleton loading */}
      {isLoading ? (
        <Stack spacing='4'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} h='52px' borderRadius='12px' />
          ))}
        </Stack>
      ) : (
        <PatientTable
          data={filteredPatients}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      )}

      {/* Modal */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        patient={selectedPatient}
      />
    </Box>
  );
}

import {
  Box,
  Flex,
  Grid,
  GridItem,
  Icon,
  IconButton,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useUser } from '@clerk/clerk-react';
import AntecedentesPanel from 'layouts/patients/AntecedentesPanel';
import PatientCard from 'layouts/patients/PatientCard';
import PatientModal from 'layouts/patients/PatientModal';
import PatientTabs from 'layouts/patients/PatientTabs';
import React from 'react';
import { MdArrowBack } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { useAntecedentesResumen } from 'hooks/useAntecedentes';
import { usePatient, useUpdatePatient } from 'hooks/usePatients';
import { CreatePatientData } from 'types/models';
import { getUserRole } from 'utils/auth';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const role = getUserRole(user) ?? '';
  const isAdmin = role === 'admin';
  const canWrite = ['admin', 'medico', 'fisioterapeuta'].includes(role);

  const { data: patient, isLoading, error } = usePatient(id!);
  const { data: resumen } = useAntecedentesResumen(id!);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const updatePatient = useUpdatePatient();

  const handleSave = async (data: CreatePatientData): Promise<void> => {
    await updatePatient.mutateAsync({ id: patient!.id, payload: data });
  };

  if (isLoading) {
    return (
      <Flex minH='60vh' align='center' justify='center'>
        <Spinner size='xl' color='brand.500' thickness='3px' />
      </Flex>
    );
  }

  if (error || !patient) {
    return (
      <Flex minH='60vh' align='center' justify='center' direction='column' gap='4'>
        <Text color='red.400' fontWeight='600' fontSize='md'>
          No se pudo cargar el paciente.
        </Text>
        <IconButton
          aria-label='Volver'
          icon={<Icon as={MdArrowBack} />}
          colorScheme='brand'
          variant='ghost'
          onClick={() => navigate('/admin/patients')}
        />
      </Flex>
    );
  }

  return (
    <Box minH='100vh' pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* Breadcrumb + back */}
      <Flex align='center' gap='2' mb='24px'>
        <IconButton
          aria-label='Volver a pacientes'
          icon={<Icon as={MdArrowBack} />}
          variant='ghost'
          size='sm'
          colorScheme='brand'
          onClick={() => navigate('/admin/patients')}
        />
        <Text color='secondaryGray.600' fontSize='sm'>
          Pacientes /{' '}
          <Text as='span' fontWeight='700' color='secondaryGray.900'>
            {patient.nombres} {patient.apellidos}
          </Text>
        </Text>
      </Flex>

      {/* Two-column layout */}
      <Grid
        templateColumns={{ base: '1fr', xl: '360px 1fr' }}
        gap='20px'
        alignItems='stretch'>
        {/* Row 1 Left: ficha del paciente */}
        <GridItem display='flex' flexDirection='column'>
          <PatientCard patient={patient} onEdit={onOpen} h='100%' />
        </GridItem>

        {/* Row 1 Right: tabs */}
        <GridItem display='flex' flexDirection='column'>
          <PatientTabs patient={patient} />
        </GridItem>

        {/* Row 2 Left: antecedentes (independiente, no afecta altura del tab) */}
        <GridItem>
          <AntecedentesPanel patient={patient} resumen={resumen} />
        </GridItem>
      </Grid>

      <PatientModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        patient={patient}
      />
    </Box>
  );
}

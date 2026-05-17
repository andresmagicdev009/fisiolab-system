import {
  Box, Button, Flex, Icon, Input, InputGroup, InputLeftElement,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader,
  ModalOverlay, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr,
  useColorModeValue, useDisclosure, Badge, IconButton, Tooltip,
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter,
  AlertDialogHeader, AlertDialogOverlay,
} from '@chakra-ui/react';
import { useState, useMemo, useCallback, useRef } from 'react';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, MdPeople } from 'react-icons/md';
import {
  createColumnHelper, flexRender, getCoreRowModel, useReactTable,
} from '@tanstack/react-table';
import Card from 'components/card/Card';
import PatientForm from 'components/patients/PatientForm';
import type { Patient } from 'types/models';
import { EstadoCivil, Genero } from 'types/models';
import type { PatientFormValues } from 'schemas/patientSchema';
import { useUser } from '@clerk/clerk-react';
import { getUserRole } from 'utils/auth';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from 'hooks/usePatients';

const columnHelper = createColumnHelper<Patient>();

export default function PatientsView() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const { user } = useUser();
  const userRole = user ? getUserRole(user) : undefined;
  const canWrite = ['admin', 'fisioterapeuta', 'medico'].includes(userRole ?? '');
  const canDelete = userRole === 'admin';

  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: patients = [], isLoading, refetch } = usePatients();
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreate = useCallback(() => {
    setSelectedPatient(null);
    onFormOpen();
  }, [onFormOpen]);

  const openEdit = useCallback((p: Patient) => {
    setSelectedPatient(p);
    onFormOpen();
  }, [onFormOpen]);

  const openDelete = useCallback((id: string) => {
    setDeletingId(id);
    onDeleteOpen();
  }, [onDeleteOpen]);

  const handleFormSubmit = useCallback((values: PatientFormValues) => {
    const clean = {
      ...values,
      email: values.email || undefined,
      telefono: values.telefono || undefined,
      telefonoEmergencia: values.telefonoEmergencia || undefined,
      direccion: values.direccion || undefined,
      ciudad: values.ciudad || undefined,
      provincia: values.provincia || undefined,
      codigoPostal: values.codigoPostal || undefined,
      ocupacion: values.ocupacion || undefined,
      estadoCivil: (values.estadoCivil as EstadoCivil) || undefined,
    };

    if (selectedPatient) {
      updateMutation.mutate(
        { id: selectedPatient.id, data: clean },
        { onSuccess: onFormClose },
      );
    } else {
      createMutation.mutate(clean as any, { onSuccess: onFormClose });
    }
  }, [selectedPatient, createMutation, updateMutation, onFormClose]);

  const handleDelete = useCallback(() => {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, { onSuccess: onDeleteClose });
  }, [deletingId, deleteMutation, onDeleteClose]);

  const columns = useMemo(() => [
    columnHelper.accessor('cedula', {
      header: () => <Text fontSize='xs' color='gray.400' fontWeight='700'>CÉDULA</Text>,
      cell: (info) => <Text color={textColor} fontSize='sm' fontWeight='600'>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('nombres', {
      header: () => <Text fontSize='xs' color='gray.400' fontWeight='700'>NOMBRES</Text>,
      cell: (info) => <Text color={textColor} fontSize='sm'>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('apellidos', {
      header: () => <Text fontSize='xs' color='gray.400' fontWeight='700'>APELLIDOS</Text>,
      cell: (info) => <Text color={textColor} fontSize='sm'>{info.getValue()}</Text>,
    }),
    columnHelper.accessor('genero', {
      header: () => <Text fontSize='xs' color='gray.400' fontWeight='700'>GÉNERO</Text>,
      cell: (info) => (
        <Badge colorScheme={
          info.getValue() === Genero.MASCULINO ? 'blue'
          : info.getValue() === Genero.FEMENINO ? 'pink'
          : 'gray'
        }>
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('telefono', {
      header: () => <Text fontSize='xs' color='gray.400' fontWeight='700'>TELÉFONO</Text>,
      cell: (info) => <Text color={textColor} fontSize='sm'>{info.getValue() ?? '—'}</Text>,
    }),
    columnHelper.accessor('ciudad', {
      header: () => <Text fontSize='xs' color='gray.400' fontWeight='700'>CIUDAD</Text>,
      cell: (info) => <Text color={textColor} fontSize='sm'>{info.getValue() ?? '—'}</Text>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <Text fontSize='xs' color='gray.400' fontWeight='700'>ACCIONES</Text>,
      cell: (info) => (
        <Flex gap='4px'>
          {canWrite && (
            <Tooltip label='Editar' hasArrow>
              <IconButton
                aria-label='Editar paciente'
                icon={<Icon as={MdEdit} />}
                size='sm'
                variant='ghost'
                colorScheme='brand'
                onClick={() => openEdit(info.row.original)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip label='Eliminar' hasArrow>
              <IconButton
                aria-label='Eliminar paciente'
                icon={<Icon as={MdDelete} />}
                size='sm'
                variant='ghost'
                colorScheme='red'
                onClick={() => openDelete(info.row.original.id)}
              />
            </Tooltip>
          )}
        </Flex>
      ),
    }),
  ], [textColor, canWrite, canDelete, openEdit, openDelete]);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter((p) =>
      p.cedula.includes(q) ||
      p.nombres.toLowerCase().includes(q) ||
      p.apellidos.toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    );
  }, [patients, search]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Card flexDirection='column' w='100%' px='0px' overflowX={{ sm: 'scroll', lg: 'hidden' }}>

        {/* Header */}
        <Flex px='25px' py='20px' justify='space-between' align='center' flexWrap='wrap' gap='12px'>
          <Flex align='center' gap='10px'>
            <Icon as={MdPeople} w='22px' h='22px' color='brand.500' />
            <Text color={textColor} fontSize='xl' fontWeight='700'>Pacientes</Text>
            {!isLoading && (
              <Badge colorScheme='brand' borderRadius='full' px='8px'>
                {filtered.length}
              </Badge>
            )}
          </Flex>

          <Flex gap='8px' align='center' flexWrap='wrap'>
            <InputGroup w={{ base: '100%', sm: '240px' }} size='sm'>
              <InputLeftElement pointerEvents='none'>
                <Icon as={MdSearch} color='gray.400' w='16px' h='16px' />
              </InputLeftElement>
              <Input
                placeholder='Buscar cédula, nombre, email...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                bg={boxBg}
                border='none'
                borderRadius='12px'
                _focus={{ bg: boxBg, boxShadow: 'none', border: '1px solid' }}
              />
            </InputGroup>

            <Tooltip label='Recargar lista' hasArrow>
              <IconButton
                aria-label='Recargar'
                icon={<Icon as={MdRefresh} />}
                size='sm'
                variant='ghost'
                onClick={() => refetch()}
                isLoading={isLoading}
              />
            </Tooltip>

            {canWrite && (
              <Button
                leftIcon={<Icon as={MdAdd} />}
                colorScheme='brand'
                size='sm'
                borderRadius='12px'
                onClick={openCreate}
              >
                Nuevo Paciente
              </Button>
            )}
          </Flex>
        </Flex>

        {/* Tabla */}
        {isLoading ? (
          <Flex justify='center' align='center' py='60px'>
            <Spinner size='lg' color='brand.500' thickness='3px' />
          </Flex>
        ) : (
          <Box>
            <Table variant='simple' color='gray.500' mb='16px'>
              <Thead>
                {table.getHeaderGroups().map((hg) => (
                  <Tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <Th key={h.id} borderColor={borderColor} pe='10px' py='12px'>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <Tr>
                    <Td colSpan={columns.length} textAlign='center' py='48px' borderColor='transparent'>
                      <Flex direction='column' align='center' gap='8px'>
                        <Icon as={MdPeople} w='32px' h='32px' color='gray.300' />
                        <Text color='gray.400' fontSize='sm'>
                          {search ? 'Sin resultados para la búsqueda' : 'No hay pacientes registrados'}
                        </Text>
                      </Flex>
                    </Td>
                  </Tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <Tr key={row.id} _hover={{ bg: boxBg }} transition='background 0.15s'>
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id} fontSize='sm' borderColor='transparent' py='10px'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Modal formulario — isLazy evita renderizar hasta primer apertura */}
      <Modal
        isOpen={isFormOpen}
        onClose={onFormClose}
        size='xl'
        scrollBehavior='inside'
        motionPreset='slideInBottom'
        closeOnOverlayClick={!isSaving}
      >
        <ModalOverlay bg='blackAlpha.600' />
        <ModalContent borderRadius='16px'>
          <ModalHeader borderBottom='1px solid' borderColor={borderColor} pb='16px'>
            {selectedPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
          </ModalHeader>
          <ModalCloseButton isDisabled={isSaving} />
          <ModalBody py='20px'>
            <PatientForm
              patient={selectedPatient}
              isLoading={isSaving}
              onSubmit={handleFormSubmit}
              onCancel={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* AlertDialog confirmar eliminar */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        motionPreset='slideInBottom'
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius='16px'>
            <AlertDialogHeader fontSize='lg' fontWeight='700'>
              Eliminar Paciente
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter gap='8px'>
              <Button ref={cancelRef} variant='ghost' onClick={onDeleteClose}>
                Cancelar
              </Button>
              <Button
                colorScheme='red'
                isLoading={deleteMutation.isPending}
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

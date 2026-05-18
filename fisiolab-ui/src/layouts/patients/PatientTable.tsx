import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import Card from 'components/card/Card';
import * as React from 'react';
import { MdDelete, MdEdit, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { Genero, Patient } from 'types/models';

const columnHelper = createColumnHelper<Patient>();

interface PatientTableProps {
  data: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  canWrite?: boolean;
  canDelete?: boolean;
}

export default function PatientTable({
  data,
  onEdit,
  onDelete,
  canWrite = true,
  canDelete = false,
}: PatientTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  const columns = [
    columnHelper.accessor('nombres', {
      id: 'nombres',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color='gray.400'>
          PACIENTE
        </Text>
      ),
      cell: (info) => (
        <HStack spacing='3'>
          <Avatar
            size='sm'
            name={`${info.getValue()} ${info.row.original.apellidos}`}
            bg='brand.500'
            color='white'
            fontSize='xs'
          />
          <Flex direction='column'>
            <Text color={textColor} fontSize='sm' fontWeight='700'>
              {info.getValue()} {info.row.original.apellidos}
            </Text>
            <Text color='secondaryGray.600' fontSize='xs'>
              {info.row.original.email ?? '—'}
            </Text>
          </Flex>
        </HStack>
      ),
    }),
    columnHelper.accessor('cedula', {
      id: 'cedula',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color='gray.400'>
          CÉDULA
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize='sm' fontWeight='700' fontFamily='mono'>
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('telefono', {
      id: 'telefono',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color='gray.400'>
          TELÉFONO
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize='sm' fontWeight='700'>
          {info.getValue() ?? '—'}
        </Text>
      ),
    }),
    columnHelper.accessor('genero', {
      id: 'genero',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color='gray.400'>
          GÉNERO
        </Text>
      ),
      cell: (info) => {
        const g = info.getValue();
        const colorScheme =
          g === Genero.MASCULINO ? 'blue' : g === Genero.FEMENINO ? 'pink' : 'purple';
        const label =
          g === Genero.MASCULINO ? 'Masculino' : g === Genero.FEMENINO ? 'Femenino' : 'Otro';
        return (
          <Badge
            colorScheme={colorScheme}
            borderRadius='full'
            px='3'
            py='1'
            fontSize='xs'
            fontWeight='700'>
            {label}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('fechaNacimiento', {
      id: 'fechaNacimiento',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color='gray.400'>
          FECHA NAC.
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize='sm' fontWeight='700'>
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('ciudad', {
      id: 'ciudad',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color='gray.400'>
          CIUDAD
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize='sm' fontWeight='700'>
          {info.getValue() ?? '—'}
        </Text>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => (
        <Text fontSize={{ sm: '10px', lg: '12px' }} color='gray.400'>
          ACCIONES
        </Text>
      ),
      cell: (info) => (
        <HStack spacing='1'>
          {canWrite && (
            <IconButton
              aria-label='Editar paciente'
              icon={<Icon as={MdEdit} />}
              size='sm'
              colorScheme='brand'
              variant='ghost'
              onClick={() => onEdit(info.row.original)}
            />
          )}
          {canDelete && (
            <IconButton
              aria-label='Eliminar paciente'
              icon={<Icon as={MdDelete} />}
              size='sm'
              colorScheme='red'
              variant='ghost'
              onClick={() => onDelete(info.row.original.id)}
            />
          )}
        </HStack>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card flexDirection='column' w='100%' px='0px' overflowX={{ sm: 'scroll', lg: 'hidden' }}>
      <Box>
        <Table variant='simple' color='gray.500' mb='24px' mt='12px'>
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Th
                    key={header.id}
                    colSpan={header.colSpan}
                    pe='10px'
                    borderColor={borderColor}
                    cursor='pointer'
                    onClick={header.column.getToggleSortingHandler()}>
                    <Flex
                      justifyContent='space-between'
                      align='center'
                      fontSize={{ sm: '10px', lg: '12px' }}
                      color='gray.400'>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? (
                        <Icon as={MdKeyboardArrowUp} w='16px' h='16px' />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <Icon as={MdKeyboardArrowDown} w='16px' h='16px' />
                      ) : null}
                    </Flex>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Td
                    key={cell.id}
                    fontSize={{ sm: '14px' }}
                    minW={{ sm: '150px', md: '200px', lg: 'auto' }}
                    borderColor='transparent'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
            {data.length === 0 && (
              <Tr>
                <Td
                  colSpan={7}
                  textAlign='center'
                  py='40px'
                  color='secondaryGray.600'
                  fontSize='sm'>
                  No hay pacientes registrados
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Card>
  );
}

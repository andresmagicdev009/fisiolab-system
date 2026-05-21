import {
  Badge,
  Box,
  Divider,
  Flex,
  Icon,
  Skeleton,
  SkeletonText,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import Button from 'components/ui/Button';
import { useCreateTarjetero, useTarjetero, useUpdateTarjetero } from 'hooks/useTarjetero';
import TarjeteroModal from 'layouts/patients/TarjeteroModal';
import React from 'react';
import { MdCalendarToday, MdEdit, MdFolderOpen, MdAdd } from 'react-icons/md';
import { EstadoTarjetero, UpdateTarjeteroDto } from 'types/models';

const ESTADO_CONFIG: Record<
  EstadoTarjetero,
  { label: string; colorScheme: string; dot: string }
> = {
  [EstadoTarjetero.ACTIVO]: {
    label: 'Activo',
    colorScheme: 'green',
    dot: 'green.400',
  },
  [EstadoTarjetero.INACTIVO]: {
    label: 'Inactivo',
    colorScheme: 'orange',
    dot: 'orange.400',
  },
  [EstadoTarjetero.ARCHIVADO]: {
    label: 'Archivado',
    colorScheme: 'gray',
    dot: 'gray.400',
  },
};

function formatFecha(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

interface TarjeteroCardProps {
  patientId: string;
  isAdmin: boolean;
  canWrite: boolean;
}

export default function TarjeteroCard({
  patientId,
  isAdmin,
  canWrite,
}: TarjeteroCardProps) {
  const { data: tarjetero, isLoading, error } = useTarjetero(patientId);
  const createTarjetero = useCreateTarjetero();
  const updateTarjetero = useUpdateTarjetero();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const hcBg = useColorModeValue('brand.50', 'navy.700');
  const hcBorder = useColorModeValue('brand.100', 'brand.800');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const emptyBg = useColorModeValue('gray.50', 'navy.800');

  const noTarjetero = !tarjetero && (error as any)?.response?.status === 404;

  const handleSave = async (payload: UpdateTarjeteroDto): Promise<void> => {
    if (tarjetero) {
      await updateTarjetero.mutateAsync({ patientId, payload });
    } else {
      await createTarjetero.mutateAsync({ patientId, payload });
    }
  };

  if (isLoading) {
    return (
      <Card p='24px'>
        <Skeleton h='14px' w='120px' mb='16px' borderRadius='8px' />
        <Skeleton h='52px' borderRadius='12px' mb='12px' />
        <SkeletonText noOfLines={2} spacing='3' />
      </Card>
    );
  }

  return (
    <>
      <Card p='24px'>
        {/* Header */}
        <Flex align='center' gap='2' mb='16px'>
          <Flex
            w='28px'
            h='28px'
            bg='brand.500'
            borderRadius='8px'
            align='center'
            justify='center'
            flexShrink={0}>
            <Icon as={MdFolderOpen} color='white' w='14px' h='14px' />
          </Flex>
          <Text fontSize='xs' fontWeight='800' color={mutedColor} textTransform='uppercase' letterSpacing='wider'>
            Historia Clínica
          </Text>
        </Flex>

        {noTarjetero || !tarjetero ? (
          /* ── Empty state ── */
          <Flex
            direction='column'
            align='center'
            justify='center'
            bg={emptyBg}
            borderRadius='16px'
            py='28px'
            px='16px'
            gap='12px'>
            <Flex
              w='48px'
              h='48px'
              bg='gray.100'
              borderRadius='16px'
              align='center'
              justify='center'>
              <Icon as={MdFolderOpen} color='gray.400' w='22px' h='22px' />
            </Flex>
            <Flex direction='column' align='center' gap='4px'>
              <Text fontSize='sm' fontWeight='700' color={textColor}>
                Sin tarjetero
              </Text>
              <Text fontSize='xs' color={mutedColor} textAlign='center'>
                No se ha abierto Historia Clínica para este paciente
              </Text>
            </Flex>
            {canWrite && (
              <Button
                size='sm'
                leftIcon={<Icon as={MdAdd} />}
                onClick={onOpen}>
                Crear Tarjetero
              </Button>
            )}
          </Flex>
        ) : (
          /* ── Tarjetero data ── */
          <>
            {/* HC Code badge */}
            <Box
              bg={hcBg}
              border='1px solid'
              borderColor={hcBorder}
              borderRadius='14px'
              px='16px'
              py='12px'
              mb='14px'
              textAlign='center'>
              <Text
                fontSize='9px'
                fontWeight='700'
                color='brand.500'
                textTransform='uppercase'
                letterSpacing='0.12em'
                mb='4px'>
                Código Historia Clínica
              </Text>
              <Text
                fontFamily='mono'
                fontSize='xl'
                fontWeight='800'
                color='brand.500'
                letterSpacing='0.06em'>
                {tarjetero.codigoHc}
              </Text>
            </Box>

            {/* Estado + fecha */}
            <Flex align='center' justify='space-between' mb='10px'>
              <Flex align='center' gap='6px'>
                <Box
                  w='7px'
                  h='7px'
                  borderRadius='full'
                  bg={ESTADO_CONFIG[tarjetero.estado].dot}
                  flexShrink={0}
                />
                <Badge
                  colorScheme={ESTADO_CONFIG[tarjetero.estado].colorScheme}
                  borderRadius='full'
                  px='10px'
                  py='2px'
                  fontSize='xs'
                  fontWeight='700'>
                  {ESTADO_CONFIG[tarjetero.estado].label}
                </Badge>
              </Flex>
              <Flex align='center' gap='5px' color={mutedColor}>
                <Icon as={MdCalendarToday} w='12px' h='12px' />
                <Text fontSize='xs' fontWeight='600'>
                  {formatFecha(tarjetero.fechaApertura)}
                </Text>
              </Flex>
            </Flex>

            {/* Observaciones */}
            {tarjetero.observaciones && (
              <>
                <Divider borderColor={dividerColor} mb='10px' />
                <Text
                  fontSize='9px'
                  fontWeight='700'
                  color={mutedColor}
                  textTransform='uppercase'
                  letterSpacing='wider'
                  mb='4px'>
                  Observaciones
                </Text>
                <Text fontSize='xs' color={textColor} noOfLines={3} lineHeight='1.6'>
                  {tarjetero.observaciones}
                </Text>
              </>
            )}

            {canWrite && (
              <>
                <Divider borderColor={dividerColor} my='14px' />
                <Button
                  variant='outline'
                  size='sm'
                  w='100%'
                  leftIcon={<Icon as={MdEdit} />}
                  onClick={onOpen}>
                  Editar Tarjetero
                </Button>
              </>
            )}
          </>
        )}
      </Card>

      <TarjeteroModal
        isOpen={isOpen}
        onClose={onClose}
        tarjetero={tarjetero ?? null}
        patientId={patientId}
        isAdmin={isAdmin}
        onSave={handleSave}
      />
    </>
  );
}

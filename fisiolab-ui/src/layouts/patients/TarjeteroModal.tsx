import {
  Divider,
  Flex,
  FormControl,
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
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
import React, { useEffect, useState } from 'react';
import { MdFolderOpen } from 'react-icons/md';
import { EstadoTarjetero, TarjeteroIndice, UpdateTarjeteroDto } from 'types/models';

interface TarjeteroModalProps {
  isOpen: boolean;
  onClose: () => void;
  tarjetero?: TarjeteroIndice | null;
  patientId: string;
  isAdmin: boolean;
  onSave: (payload: UpdateTarjeteroDto) => Promise<void>;
}

const ESTADO_LABELS: Record<EstadoTarjetero, string> = {
  [EstadoTarjetero.ACTIVO]: 'Activo',
  [EstadoTarjetero.INACTIVO]: 'Inactivo',
  [EstadoTarjetero.ARCHIVADO]: 'Archivado',
};

export default function TarjeteroModal({
  isOpen,
  onClose,
  tarjetero,
  isAdmin,
  onSave,
}: TarjeteroModalProps) {
  const isEditing = !!tarjetero;
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const sectionColor = useColorModeValue('brand.500', 'brand.400');
  const labelColor = useColorModeValue('secondaryGray.900', 'white');
  const textareaVariantBg = useColorModeValue('gray.50', 'navy.700');
  const textareaBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  const [estado, setEstado] = useState<EstadoTarjetero>(EstadoTarjetero.ACTIVO);
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEstado(tarjetero?.estado ?? EstadoTarjetero.ACTIVO);
      setObservaciones(tarjetero?.observaciones ?? '');
    }
  }, [isOpen, tarjetero]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (observaciones.length > 500) {
      toast({
        title: 'Observaciones demasiado largas (máx. 500 caracteres)',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateTarjeteroDto = {
        observaciones: observaciones.trim() || undefined,
      };
      if (isEditing) {
        payload.estado = estado;
      }
      await onSave(payload);
      toast({
        title: isEditing ? 'Tarjetero actualizado' : 'Tarjetero creado',
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
          ? 'Este paciente ya tiene un tarjetero activo'
          : status === 403
          ? 'Sin permisos para esta operación'
          : err?.response?.data?.message ?? 'Error al guardar. Intente nuevamente';
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableEstados = isAdmin
    ? Object.values(EstadoTarjetero)
    : [EstadoTarjetero.ACTIVO, EstadoTarjetero.INACTIVO];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='lg' scrollBehavior='inside'>
      <ModalOverlay />
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
              <Icon as={MdFolderOpen} color='white' w='20px' h='20px' />
            </Flex>
            <Flex direction='column'>
              <Text color={textColor} fontSize='lg' fontWeight='800'>
                {isEditing ? 'Editar Tarjetero' : 'Crear Tarjetero'}
              </Text>
              <Text color='secondaryGray.600' fontSize='sm' fontWeight='400'>
                {isEditing
                  ? `Código ${tarjetero.codigoHc}`
                  : 'Apertura de Historia Clínica'}
              </Text>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top='20px' />

        <ModalBody pt='20px' pb='6'>
          <form id='tarjetero-form' onSubmit={handleSubmit}>
            {isEditing && (
              <>
                <Text
                  color={sectionColor}
                  fontSize='xs'
                  fontWeight='800'
                  textTransform='uppercase'
                  letterSpacing='wider'
                  mb='12px'>
                  Estado
                </Text>
                <FormControl mb='20px'>
                  <FormLabel ms='10px' fontSize='sm' color={labelColor} fontWeight='bold'>
                    Estado del Tarjetero
                  </FormLabel>
                  <Select
                    h='44px'
                    variant='main'
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoTarjetero)}>
                    {availableEstados.map((e) => (
                      <option key={e} value={e}>
                        {ESTADO_LABELS[e]}
                        {e === EstadoTarjetero.ARCHIVADO && !isAdmin
                          ? ' (solo admin)'
                          : ''}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Divider mb='20px' />
              </>
            )}

            <Text
              color={sectionColor}
              fontSize='xs'
              fontWeight='800'
              textTransform='uppercase'
              letterSpacing='wider'
              mb='12px'>
              Observaciones
            </Text>
            <FormControl>
              <FormLabel ms='10px' fontSize='sm' color={labelColor} fontWeight='bold'>
                Notas{' '}
                <Text as='span' fontWeight='400' color='secondaryGray.500'>
                  (opcional, máx. 500 chars)
                </Text>
              </FormLabel>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder='Paciente referido por Dr. Ramírez...'
                rows={4}
                bg={textareaVariantBg}
                border='1px solid'
                borderColor={textareaBorder}
                borderRadius='16px'
                fontSize='sm'
                fontWeight='500'
                resize='vertical'
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
              />
              <Text
                mt='6px'
                ms='10px'
                fontSize='xs'
                color={observaciones.length > 500 ? 'red.400' : 'secondaryGray.500'}>
                {observaciones.length}/500
              </Text>
            </FormControl>
          </form>
        </ModalBody>

        <ModalFooter gap='3'>
          <Button variant='light' onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type='submit'
            form='tarjetero-form'
            isLoading={isSubmitting}
            leftIcon={<Icon as={MdFolderOpen} />}>
            {isEditing ? 'Guardar cambios' : 'Crear Tarjetero'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import {
  Avatar,
  Badge,
  Box,
  Divider,
  Flex,
  Icon,
  IconButton,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import Button from 'components/ui/Button';
import { useTarjetero } from 'hooks/useTarjetero';
import React, { useState } from 'react';
import { MdCheck, MdContentCopy, MdDownload, MdEdit, MdEmail, MdFolderOpen, MdLocationOn, MdPhone, MdPhoneCallback, MdWork } from 'react-icons/md';
import { historiaClinicaService } from 'services/historiaClinicaService';
import { generateHistoriaPdf } from 'utils/generateHistoriaPdf';
import { EstadoCivil, EstadoTarjetero, Genero, Patient } from 'types/models';

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  ) {
    edad--;
  }
  return edad;
}

const GENERO_BADGE: Record<Genero, { label: string; colorScheme: string }> = {
  [Genero.MASCULINO]: { label: 'Masculino', colorScheme: 'blue' },
  [Genero.FEMENINO]: { label: 'Femenino', colorScheme: 'pink' },
  [Genero.OTRO]: { label: 'Otro', colorScheme: 'purple' },
};

const AVATAR_GRADIENT: Record<Genero, string> = {
  [Genero.MASCULINO]: 'linear(to-br, blue.400, brand.500)',
  [Genero.FEMENINO]: 'linear(to-br, pink.400, purple.500)',
  [Genero.OTRO]: 'linear(to-br, purple.400, brand.500)',
};

const TARJETERO_DOT: Record<EstadoTarjetero, string> = {
  [EstadoTarjetero.ACTIVO]: '#68D391',
  [EstadoTarjetero.INACTIVO]: '#F6AD55',
  [EstadoTarjetero.ARCHIVADO]: '#A0AEC0',
};

const ESTADO_CIVIL_LABEL: Partial<Record<EstadoCivil, string>> = {
  [EstadoCivil.SOLTERO]: 'Soltero/a',
  [EstadoCivil.CASADO]: 'Casado/a',
  [EstadoCivil.DIVORCIADO]: 'Divorciado/a',
  [EstadoCivil.VIUDO]: 'Viudo/a',
  [EstadoCivil.UNION_LIBRE]: 'Unión Libre',
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Tooltip label={copied ? '¡Copiado!' : 'Copiar'} placement='top' hasArrow>
      <IconButton
        aria-label='Copiar'
        icon={<Icon as={copied ? MdCheck : MdContentCopy} w='13px' h='13px' />}
        size='xs'
        variant='ghost'
        colorScheme={copied ? 'green' : 'gray'}
        minW='20px'
        h='20px'
        onClick={handleCopy}
        flexShrink={0}
      />
    </Tooltip>
  );
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  copyable?: boolean;
}

function InfoRow({ icon, label, value, copyable }: InfoRowProps) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const labelColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const iconBg = useColorModeValue('brand.50', 'navy.700');

  if (!value) return null;

  return (
    <Flex align='center' gap='2' py='6px'>
      <Flex
        w='28px'
        h='28px'
        bg={iconBg}
        borderRadius='8px'
        align='center'
        justify='center'
        flexShrink={0}>
        <Icon as={icon} color='brand.500' w='14px' h='14px' />
      </Flex>
      <Flex direction='column' minW={0} flex={1}>
        <Text
          fontSize='9px'
          color={labelColor}
          fontWeight='700'
          textTransform='uppercase'
          letterSpacing='0.08em'>
          {label}
        </Text>
        <Text fontSize='sm' color={textColor} fontWeight='600' noOfLines={1}>
          {value}
        </Text>
      </Flex>
      {copyable && <CopyButton value={value} />}
    </Flex>
  );
}

interface PatientCardProps {
  patient: Patient;
  onEdit: () => void;
  [x: string]: any;
}

export default function PatientCard({ patient, onEdit, ...rest }: PatientCardProps) {
  const { data: tarjetero } = useTarjetero(patient.id);
  const [pdfLoading, setPdfLoading] = useState(false);
  const toast = useToast();

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const data = await historiaClinicaService.getResumen(patient.id);
      generateHistoriaPdf(data, `${patient.nombres} ${patient.apellidos}`);
    } catch {
      toast({
        title: 'Error al generar PDF',
        description: 'No se pudo descargar la historia clínica.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const statBg = useColorModeValue('gray.50', 'navy.700');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const hcBg = useColorModeValue('brand.50', 'navy.700');
  const hcBorder = useColorModeValue('brand.100', 'brand.800');

  const edad = calcularEdad(patient.fechaNacimiento);
  const { label: generoLabel, colorScheme: generoColor } = GENERO_BADGE[patient.genero];
  const ciudad = [patient.ciudad, patient.provincia].filter(Boolean).join(', ');

  return (
    <Card p='24px' {...rest}>
      {/* Avatar + nombre */}
      <Flex direction='column' align='center' textAlign='center' mb='20px'>
        <Box bgGradient={AVATAR_GRADIENT[patient.genero]} borderRadius='full' p='3px' mb='14px'>
          <Avatar
            size='xl'
            name={`${patient.nombres} ${patient.apellidos}`}
            bg='transparent'
            color='white'
            fontSize='xl'
            fontWeight='800'
          />
        </Box>
        <Flex align='center' gap='1' justify='center'>
          <Text color={textColor} fontSize='lg' fontWeight='800' lineHeight='1.3'>
            {patient.nombres} {patient.apellidos}
          </Text>
          <CopyButton value={`${patient.nombres} ${patient.apellidos}`} />
        </Flex>
        <Flex align='center' gap='2' flexWrap='wrap' justify='center' mb='8px'>
          <Badge
            fontFamily='mono'
            fontSize='xs'
            colorScheme='gray'
            borderRadius='full'
            px='3'
            py='1'>
            {patient.cedula}
          </Badge>
          <Badge colorScheme={generoColor} borderRadius='full' px='3' py='1' fontSize='xs'>
            {generoLabel}
          </Badge>
        </Flex>

        {/* Código HC */}
        {tarjetero ? (
          <Flex
            align='center'
            gap='8px'
            bg={hcBg}
            border='1px solid'
            borderColor={hcBorder}
            borderRadius='10px'
            px='12px'
            py='7px'>
            <Box
              w='7px' h='7px' borderRadius='full'
              bg={TARJETERO_DOT[tarjetero.estado]}
              flexShrink={0}
            />
            <Icon as={MdFolderOpen} color='brand.500' w='13px' h='13px' flexShrink={0} />
            <Text fontFamily='mono' fontSize='sm' fontWeight='800' color='brand.500' flex={1}>
              {tarjetero.codigoHc}
            </Text>
            <CopyButton value={tarjetero.codigoHc} />
          </Flex>
        ) : (
          <Flex
            align='center'
            gap='6px'
            bg={statBg}
            borderRadius='10px'
            px='12px'
            py='7px'>
            <Icon as={MdFolderOpen} color='secondaryGray.400' w='13px' h='13px' />
            <Text fontSize='xs' color='secondaryGray.400' fontWeight='600'>
              Sin historia clínica
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Stats rápidos */}
      <Flex bg={statBg} borderRadius='12px' p='12px' mb='16px' justify='space-around'>
        <Flex direction='column' align='center' gap='1px'>
          <Text fontSize='2xl' fontWeight='800' color='brand.500' lineHeight='1'>
            {edad}
          </Text>
          <Text
            fontSize='9px'
            color='secondaryGray.500'
            fontWeight='700'
            textTransform='uppercase'
            letterSpacing='wider'>
            años
          </Text>
        </Flex>
        <Box w='1px' bg={dividerColor} />
        <Flex direction='column' align='center' gap='1px' maxW='120px'>
          <Text fontSize='sm' fontWeight='700' color={textColor} noOfLines={1}>
            {patient.estadoCivil ? ESTADO_CIVIL_LABEL[patient.estadoCivil] : '—'}
          </Text>
          <Text
            fontSize='9px'
            color='secondaryGray.500'
            fontWeight='700'
            textTransform='uppercase'
            letterSpacing='wider'>
            Estado civil
          </Text>
        </Flex>
      </Flex>

      {/* Info rows */}
      <Flex direction='column' mb='20px'>
        <InfoRow icon={MdPhone} label='Teléfono' value={patient.telefono} copyable />
        <InfoRow icon={MdPhoneCallback} label='Emergencia' value={patient.telefonoEmergencia} />
        <InfoRow icon={MdEmail} label='Email' value={patient.email} copyable />
        <InfoRow icon={MdLocationOn} label='Ciudad' value={ciudad || null} />
        <InfoRow icon={MdWork} label='Ocupación' value={patient.ocupacion} />
      </Flex>

      <Divider borderColor={dividerColor} mb='16px' />

      <Button
        variant='brand'
        size='sm'
        w='100%'
        leftIcon={<Icon as={MdEdit} />}
        onClick={onEdit}>
        Editar datos
      </Button>

      <Button
        mt='8px'
        variant='outline'
        size='sm'
        w='100%'
        leftIcon={<Icon as={MdDownload} />}
        onClick={handleDownloadPdf}
        isLoading={pdfLoading}
        loadingText='Generando PDF...'
        isDisabled={!tarjetero}>
        Descargar Historia Clínica PDF
      </Button>
    </Card>
  );
}

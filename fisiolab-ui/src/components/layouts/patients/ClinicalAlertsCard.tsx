import {
  Badge,
  Box,
  Flex,
  Icon,
  Skeleton,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import { useAntecedentesResumen } from 'hooks/useAntecedentes';
import React from 'react';
import {
  MdLocalHospital,
  MdPregnantWoman,
  MdScience,
  MdSmokingRooms,
  MdWarning,
} from 'react-icons/md';
import { AntecedentesCompletos, Genero, Patient } from 'types/models';

interface Alert {
  label: string;
  colorScheme: string;
  icon: React.ElementType;
}

function buildAlerts(resumen: AntecedentesCompletos, genero: Genero): Alert[] {
  const alerts: Alert[] = [];
  const pat = resumen.patologicos;
  const noP = resumen.noPatologicos;
  const gin = resumen.ginecoObstetricos;

  if (pat) {
    if (pat.diabetesMellitus)
      alerts.push({ label: pat.diabetesTipo ? `DM ${pat.diabetesTipo}` : 'Diabetes', colorScheme: 'orange', icon: MdWarning });
    if (pat.hipertensionArterial)
      alerts.push({ label: 'HTA', colorScheme: 'red', icon: MdWarning });
    if (pat.cardiopatias)
      alerts.push({ label: pat.cardiopatiasTipo ? `Cardiopatía: ${pat.cardiopatiasTipo}` : 'Cardiopatía', colorScheme: 'red', icon: MdLocalHospital });
    if (pat.cancer)
      alerts.push({ label: pat.cancerRemision ? 'Cáncer (remisión)' : 'Cáncer activo', colorScheme: pat.cancerRemision ? 'yellow' : 'red', icon: MdLocalHospital });
    if (pat.epilepsia)
      alerts.push({ label: pat.epilepsiaControlada ? 'Epilepsia controlada' : 'Epilepsia', colorScheme: 'orange', icon: MdWarning });
    if (pat.vihSida)
      alerts.push({ label: 'VIH/SIDA', colorScheme: 'red', icon: MdWarning });
    if (pat.tuberculosis)
      alerts.push({ label: 'TBC', colorScheme: 'orange', icon: MdLocalHospital });
    if (pat.alergiasMedicamentos && pat.alergiasMedicamentos.length > 0)
      alerts.push({ label: `Alergia medicamentos (${pat.alergiasMedicamentos.length})`, colorScheme: 'red', icon: MdScience });
    if (pat.cirugias && pat.cirugias.length > 0)
      alerts.push({ label: `Cirugías previas (${pat.cirugias.length})`, colorScheme: 'purple', icon: MdLocalHospital });
    if (pat.traumatismos && pat.traumatismos.length > 0)
      alerts.push({ label: `Traumatismos (${pat.traumatismos.length})`, colorScheme: 'purple', icon: MdWarning });
    if (pat.accidenteCerebrovascular)
      alerts.push({ label: 'ACV previo', colorScheme: 'red', icon: MdWarning });
  }

  if (noP) {
    if (noP.tabaquismo)
      alerts.push({ label: 'Fumador', colorScheme: 'yellow', icon: MdSmokingRooms });
    if (noP.alcoholismo)
      alerts.push({ label: 'Alcoholismo', colorScheme: 'yellow', icon: MdWarning });
    if (noP.drogas)
      alerts.push({ label: 'Drogas', colorScheme: 'orange', icon: MdWarning });
  }

  if (gin && genero === Genero.FEMENINO) {
    if (gin.embarazoActual)
      alerts.push({
        label: gin.embarazoActualSemanas ? `Embarazada (${gin.embarazoActualSemanas} sem)` : 'Embarazada',
        colorScheme: 'pink',
        icon: MdPregnantWoman,
      });
  }

  return alerts;
}

interface Props {
  patient: Patient;
}

export default function ClinicalAlertsCard({ patient }: Props) {
  const { data: resumen, isLoading } = useAntecedentesResumen(patient.id);

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const emptyColor = useColorModeValue('secondaryGray.400', 'secondaryGray.500');
  const iconColor = useColorModeValue('red.400', 'red.300');

  const alerts = resumen ? buildAlerts(resumen, patient.genero) : [];

  return (
    <Card p='16px'>
      {/* Header */}
      <Flex align='center' gap='8px' mb='12px'>
        <Flex
          w='32px' h='32px' bg='red.50' borderRadius='10px'
          align='center' justify='center' flexShrink={0}>
          <Icon as={MdLocalHospital} color={iconColor} w='16px' h='16px' />
        </Flex>
        <Text fontSize='sm' fontWeight='800' color={textColor}>
          Alertas Clínicas
        </Text>
        {alerts.length > 0 && (
          <Flex
            w='20px' h='20px' borderRadius='full' bg='red.500'
            align='center' justify='center' flexShrink={0}>
            <Text fontSize='10px' fontWeight='800' color='white'>
              {alerts.length}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex direction='column' gap='6px'>
          <Skeleton h='22px' borderRadius='full' w='70%' />
          <Skeleton h='22px' borderRadius='full' w='50%' />
          <Skeleton h='22px' borderRadius='full' w='60%' />
        </Flex>
      ) : alerts.length === 0 ? (
        <Flex direction='column' align='center' gap='6px' py='8px'>
          <Text fontSize='xs' color={emptyColor} textAlign='center'>
            {resumen
              ? 'Sin alertas clínicas relevantes registradas'
              : 'Antecedentes no registrados aún'}
          </Text>
          <Text fontSize='10px' color={emptyColor} textAlign='center'>
            Ver pestaña Antecedentes para registrar
          </Text>
        </Flex>
      ) : (
        <Flex flexWrap='wrap' gap='6px'>
          {alerts.map((alert, i) => (
            <Badge
              key={i}
              colorScheme={alert.colorScheme}
              borderRadius='full'
              px='10px'
              py='4px'
              fontSize='11px'
              fontWeight='700'
              display='flex'
              alignItems='center'
              gap='4px'>
              <Icon as={alert.icon} w='11px' h='11px' />
              {alert.label}
            </Badge>
          ))}
        </Flex>
      )}
    </Card>
  );
}

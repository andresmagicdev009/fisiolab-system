import { Box, SimpleGrid, Icon, useColorModeValue, Text, Flex } from '@chakra-ui/react';
import { MdPeople, MdPersonAdd, MdAssignment, MdSecurity } from 'react-icons/md';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import Card from 'components/card/Card';

export default function AdminDashboard() {
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textMuted = useColorModeValue('gray.500', 'gray.400');

  const roleStats = [
    { rol: 'Fisioterapeutas', count: '—' },
    { rol: 'Médicos', count: '—' },
    { rol: 'Pasantes', count: '—' },
    { rol: 'Pacientes', count: '—' },
  ];

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap='20px' mb='20px'>
        <MiniStatistics
          startContent={
            <IconBox w='56px' h='56px' bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdPeople} color={brandColor} />} />
          }
          name='Total Pacientes'
          value='—'
        />
        <MiniStatistics
          startContent={
            <IconBox w='56px' h='56px' bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdPersonAdd} color={brandColor} />} />
          }
          name='Usuarios Registrados'
          value='—'
        />
        <MiniStatistics
          startContent={
            <IconBox w='56px' h='56px' bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdAssignment} color={brandColor} />} />
          }
          name='Sesiones Hoy'
          value='—'
        />
        <MiniStatistics
          startContent={
            <IconBox w='56px' h='56px' bg='linear-gradient(90deg, #4481EB 0%, #04BEFE 100%)'
              icon={<Icon w='28px' h='28px' as={MdSecurity} color='white' />} />
          }
          name='Eventos de Auditoría'
          value='—'
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap='20px' mb='20px'>
        <Card p='20px'>
          <Text color={textColor} fontSize='lg' fontWeight='700' mb='16px'>
            Distribución por Rol
          </Text>
          <Flex direction='column' gap='12px'>
            {roleStats.map((item) => (
              <Flex key={item.rol} justify='space-between' align='center'
                p='12px' borderRadius='8px' bg={boxBg}>
                <Text color={textColor} fontWeight='500'>{item.rol}</Text>
                <Text color={brandColor} fontWeight='700'>{item.count}</Text>
              </Flex>
            ))}
          </Flex>
        </Card>

        <Card p='20px'>
          <Text color={textColor} fontSize='lg' fontWeight='700' mb='16px'>
            Accesos Rápidos
          </Text>
          <Flex direction='column' gap='10px'>
            {[
              'Gestión de Usuarios',
              'Registro de Auditoría',
              'Configuración del Sistema',
              'Gestión de Pacientes',
            ].map((item) => (
              <Flex key={item} align='center' p='10px' borderRadius='8px'
                _hover={{ bg: boxBg, cursor: 'pointer' }} transition='0.2s'>
                <Text color={textColor} fontWeight='500'>{item}</Text>
              </Flex>
            ))}
          </Flex>
        </Card>
      </SimpleGrid>

      <Card p='20px'>
        <Text color={textColor} fontSize='lg' fontWeight='700' mb='8px'>
          Actividad Reciente
        </Text>
        <Text color={textMuted} fontSize='sm'>
          Los módulos de estadísticas avanzadas estarán disponibles próximamente.
        </Text>
      </Card>
    </Box>
  );
}

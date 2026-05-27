import { Box, SimpleGrid, Icon, useColorModeValue, Text, Flex, Button } from '@chakra-ui/react';
import { MdPeople, MdToday, MdAccessTime, MdPersonSearch } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import Card from 'components/card/Card';
import { useUser } from '@clerk/clerk-react';

export default function FisioDashboard() {
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const textMuted = useColorModeValue('gray.500', 'gray.400');
  const navigate = useNavigate();
  const { user } = useUser();

  const nombre = user?.firstName ?? 'Fisioterapeuta';

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Flex justify='space-between' align='center' mb='24px' flexWrap='wrap' gap='12px'>
        <Box>
          <Text color={textColor} fontSize='2xl' fontWeight='700'>
            Bienvenido, {nombre}
          </Text>
          <Text color={textMuted} fontSize='sm'>
            Panel de Fisioterapia
          </Text>
        </Box>
        <Button
          leftIcon={<Icon as={MdPersonSearch} />}
          colorScheme='brand'
          onClick={() => navigate('/admin/patients')}>
          Ver Pacientes
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap='20px' mb='20px'>
        <MiniStatistics
          startContent={
            <IconBox w='56px' h='56px' bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdPeople} color={brandColor} />} />
          }
          name='Pacientes Asignados'
          value='—'
        />
        <MiniStatistics
          startContent={
            <IconBox w='56px' h='56px' bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdToday} color={brandColor} />} />
          }
          name='Sesiones Hoy'
          value='—'
        />
        <MiniStatistics
          startContent={
            <IconBox w='56px' h='56px' bg={boxBg}
              icon={<Icon w='32px' h='32px' as={MdAccessTime} color={brandColor} />} />
          }
          name='Pendientes esta Semana'
          value='—'
        />
        <MiniStatistics
          startContent={
            <IconBox w='56px' h='56px' bg='linear-gradient(90deg, #4481EB 0%, #04BEFE 100%)'
              icon={<Icon w='28px' h='28px' as={MdPeople} color='white' />} />
          }
          name='Total Pacientes'
          value='—'
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap='20px'>
        <Card p='20px'>
          <Text color={textColor} fontSize='lg' fontWeight='700' mb='16px'>
            Acciones Rápidas
          </Text>
          <Flex direction='column' gap='10px'>
            <Button variant='outline' colorScheme='brand' justifyContent='flex-start'
              leftIcon={<Icon as={MdPersonSearch} />}
              onClick={() => navigate('/admin/patients')}>
              Buscar Paciente
            </Button>
            <Button variant='outline' colorScheme='brand' justifyContent='flex-start'
              leftIcon={<Icon as={MdPeople} />}
              onClick={() => navigate('/admin/patients')}>
              Nuevo Paciente
            </Button>
          </Flex>
        </Card>

        <Card p='20px'>
          <Text color={textColor} fontSize='lg' fontWeight='700' mb='8px'>
            Próximas Sesiones
          </Text>
          <Text color={textMuted} fontSize='sm'>
            El módulo de agenda estará disponible próximamente.
          </Text>
        </Card>
      </SimpleGrid>
    </Box>
  );
}

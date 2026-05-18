import {
  Box,
  Flex,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import React from 'react';
import {
  MdAssignment,
  MdCalendarMonth,
  MdCreditCard,
  MdFitnessCenter,
  MdNoteAlt,
} from 'react-icons/md';
import { Patient } from 'types/models';

interface TabConfig {
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  { label: 'Citas', icon: MdCalendarMonth, description: 'Agenda y seguimiento de citas del paciente' },
  { label: 'Historia Clínica', icon: MdNoteAlt, description: 'Notas SOAP, episodios clínicos y evolución' },
  { label: 'Evaluaciones', icon: MdAssignment, description: 'Evaluaciones físicas y funcionales' },
  { label: 'Tratamiento', icon: MdFitnessCenter, description: 'Plan de tratamiento y ejercicios asignados' },
  { label: 'Pagos', icon: MdCreditCard, description: 'Historial de pagos y facturas' },
];

interface PlaceholderTabConfig {
  icon: React.ElementType;
  title: string;
  description: string;
}

function PlaceholderTab({ icon, title, description }: PlaceholderTabConfig) {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');
  const iconBg = useColorModeValue('brand.50', 'navy.700');

  return (
    <Flex
      direction='column'
      align='center'
      justify='center'
      minH='320px'
      gap='16px'
      py='40px'>
      <Flex
        w='64px'
        h='64px'
        bg={iconBg}
        borderRadius='20px'
        align='center'
        justify='center'>
        <Icon as={icon} color='brand.500' w='28px' h='28px' />
      </Flex>
      <Flex direction='column' align='center' gap='6px'>
        <Text fontSize='md' fontWeight='800' color={textColor}>
          {title}
        </Text>
        <Text fontSize='sm' color={mutedColor} textAlign='center' maxW='300px'>
          {description}
        </Text>
        <Text
          fontSize='10px'
          fontWeight='700'
          color='brand.500'
          bg='brand.50'
          px='12px'
          py='4px'
          borderRadius='full'
          mt='4px'>
          PRÓXIMAMENTE
        </Text>
      </Flex>
    </Flex>
  );
}

interface PatientTabsProps {
  patient: Patient;
}

export default function PatientTabs({ patient: _ }: PatientTabsProps) {
  const tabColor = useColorModeValue('secondaryGray.600', 'secondaryGray.400');
  const activeTabColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  return (
    <Card p='0' overflow='hidden'>
      <Tabs colorScheme='brand' isLazy>
        <Box borderBottom='1px solid' borderColor={borderColor}>
          <TabList
            px='20px'
            gap='0'
            overflowX='auto'
            sx={{
              '::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}>
            {TABS.map((tab) => (
              <Tab
                key={tab.label}
                px='16px'
                py='16px'
                fontSize='sm'
                fontWeight='600'
                color={tabColor}
                _selected={{
                  color: activeTabColor,
                  fontWeight: '800',
                  borderBottomColor: 'brand.500',
                  borderBottomWidth: '2px',
                }}
                _focus={{ boxShadow: 'none' }}
                whiteSpace='nowrap'
                display='flex'
                alignItems='center'
                gap='6px'>
                <Icon as={tab.icon} w='16px' h='16px' />
                {tab.label}
              </Tab>
            ))}
          </TabList>
        </Box>

        <TabPanels>
          {TABS.map((tab) => (
            <TabPanel key={tab.label} p='0'>
              <PlaceholderTab
                icon={tab.icon}
                title={tab.label}
                description={tab.description}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Card>
  );
}

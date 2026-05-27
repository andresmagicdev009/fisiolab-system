import React, { useState } from 'react';
import { Box, Flex, Heading, VStack, Icon, IconButton } from '@chakra-ui/react';
import { AgendaCalendar } from 'components/calendar/Calendar';
import Dropdown, { DropdownItem } from 'components/ui/Dropdown';

// Crear componente SVG para el ícono
const CirclePlusIcon = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
    </svg>
);

export const CalendarPreview: React.FC = () => {
    const [selectedOption, setSelectedOption] = useState<string | number>('');

    const handleSelectDate = (date: Date) => {
        console.log('Fecha seleccionada:', date);
    };

    const viewOptions: DropdownItem[] = [
        { label: 'Vista Semanal am', value: 'week' },
        { label: 'Vista Mensual pm', value: 'month' },
        { label: 'Vista Diaria am', value: 'day' },
    ];

    const actionOptions: DropdownItem[] = [
        { label: 'Exportar', value: 'export' },
        { label: 'Imprimir', value: 'print' },
        { label: 'Eliminar', value: 'delete', isDanger: true },
    ];

    const handleViewChange = (value: string | number) => {
        console.log('Vista cambiada a:', value);
        setSelectedOption(value);
    };

    const handleAction = (value: string | number) => {
        console.log('Acción ejecutada:', value);
    };

    const handleAddClick = () => {
        console.log('Botón agregar clickeado');
    };

    return (
        <Box p="20px" minH="100vh">
            <VStack spacing={6} align="stretch">
                <Heading as="h1" size="xl">
                    Vista Previa del Calendario
                </Heading>

                {/* Controles - En una fila separada */}
                <Flex gap="4" mb="4" align="center">
                    <Dropdown
                        label="Repetir semanalmente"
                        items={viewOptions}
                        onSelect={handleViewChange}
                        colorScheme="blue"
                        size="sm"
                        borderRadius="6px"
                        px="20px"
                        py="22px"
                    />
                    <Dropdown
                        label="Acciones"
                        items={actionOptions}
                        onSelect={handleAction}
                        colorScheme="gray"
                        size="sm"
                        borderRadius="6px"
                        px="20px"
                        py="20px"
                    />

                    {/* IconButton - Solo icono centrado */}
                    <IconButton
                        aria-label="Agregar"
                        icon={<Icon as={CirclePlusIcon} w="24px" h="24px" />}
                        onClick={handleAddClick}
                        borderRadius="50%"
                        w="44px"
                        h="44px"
                        bg="transparent"
                        border="2px solid transparent"
                        color="brand.500"
                        //transition="all 0.2s ease"
                        _hover={{
                            border: "2px solid",
                            bg: "rgba(66, 42, 251, 0.1)",
                        }}
                        _active={{
                            
                        }}
                    />
                </Flex>

                {/* Calendario */}
                <Box w="100%" h="calc(100vh - 200px)">
                    <AgendaCalendar onSelectDate={handleSelectDate} />
                </Box>
            </VStack>
        </Box>
    );
};

export default CalendarPreview;
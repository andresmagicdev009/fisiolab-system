import React, { useState } from 'react';
import {
    Box,
    Flex,
    Heading,
    VStack,
    HStack,
    Container,
    Divider,
    Text,
    useColorModeValue,
    Button,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';
import VerificationCodeInput from 'components/fields/VerificationCodeInput';
import Timer from 'components/fields/Timer';

export const VerificationCodeInputPreview: React.FC = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const bgColor = useColorModeValue('white', 'navy.800');
    const textColor = useColorModeValue('navy.700', 'white');
    const containerBg = useColorModeValue('gray.50', 'navy.900');

    const handleVerify = () => {
        if (code.length !== 6) {
            setError('El código debe tener 6 dígitos');
            return;
        }
        setError('');
        setSubmitted(true);
        console.log('Código verificado:', code);
    };

    const handleReset = () => {
        setCode('');
        setError('');
        setSubmitted(false);
    };

    const handleTimerExpire = () => {
        setError('El código ha expirado. Solicita uno nuevo.');
        setCode('');
    };

    return (
        <Container maxW='container.lg' py='40px'>
            <VStack spacing='40px' align='stretch'>
                {/* Título */}
                <Box>
                    <Heading fontSize='32px' color={textColor} mb='8px'>
                        Verificación de Código
                    </Heading>
                    <Text color='gray.500' fontSize='md'>
                        Preview del componente VerificationCodeInput + Timer
                    </Text>
                </Box>

                <Divider />

                {/* Estado 1: Normal */}
                <Box bg={bgColor} p='32px' borderRadius='7px' boxShadow='sm' maxW='500px' mx='auto'>
                    <VStack spacing='24px' align='stretch'>
                        <VerificationCodeInput
                            value={code}
                            onChange={setCode}
                            label='Ingresa el código de verificación'
                            helperText='Se ha enviado un código de 6 dígitos a tu correo electrónico'
                            error={error}
                        />
                        
                        {/* Timer */}
                        <Flex justify='center' w='100%'>
                            <Timer 
                                seconds={300} 
                                onExpire={handleTimerExpire}
                                showLabel={true}
                            />
                        </Flex>

                        <HStack spacing='4px' justify='center' w='100%'>
                            <Text fontSize='sm' >
                                No has recibido el código?
                            </Text>
                            <Text
                                fontSize='sm'
                                color='brand.500'
                                fontWeight='600'
                                _hover={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => console.log('Reenviar código')}>
                                Click para reenviar
                            </Text>
                        </HStack>
                        <HStack spacing='12px' justify='center' w='100%'>
                            <Button
                                w='355px'
                                colorScheme='blue'
                                onClick={handleVerify}
                                isDisabled={code.length !== 6}>
                                Verificar
                            </Button>
                        </HStack>
                    </VStack>
                </Box>

                {/* Estado 2: Con Error */}
                <Box bg={bgColor} p='32px' borderRadius='12px' boxShadow='sm'>
                    <Heading fontSize='18px' color={textColor} mb='24px'>
                        Estado con Error
                    </Heading>
                    <VerificationCodeInput
                        value='123abc'
                        onChange={() => { }}
                        label='Código incorrecto'
                        error='El código que ingresaste es incorrecto. Intenta de nuevo.'
                        helperText='Se ha enviado un código de 6 dígitos a tu correo electrónico'
                    />
                    <Flex justify='center' w='100%' mt='16px'>
                        <Timer seconds={120} showLabel={true} />
                    </Flex>
                </Box>

                {/* Estado 3: Deshabilitado */}
                <Box bg={bgColor} p='32px' borderRadius='12px' boxShadow='sm'>
                    <Heading fontSize='18px' color={textColor} mb='24px'>
                        Estado Deshabilitado
                    </Heading>
                    <VerificationCodeInput
                        value='123456'
                        onChange={() => { }}
                        label='Verificando...'
                        isDisabled={true}
                        helperText='Por favor espera mientras verificamos tu código'
                    />
                </Box>

                {/* Estado 4: Completado */}
                {submitted && (
                    <Alert
                        status='success'
                        borderRadius='12px'
                        flexDirection='column'
                        alignItems='flex-start'
                        height='auto'
                        p='24px'>
                        <Flex align='flex-start'>
                            <AlertIcon boxSize='20px' mt='2px' />
                            <VStack align='start' ms='12px' spacing='8px'>
                                <Text fontWeight='600'>Código verificado correctamente</Text>
                                <Text fontSize='sm'>
                                    Tu código {code} ha sido validado. Puedes continuar.
                                </Text>
                            </VStack>
                        </Flex>
                    </Alert>
                )}

                {/* Características */}
                <Box bg={bgColor} p='32px' borderRadius='12px' boxShadow='sm'>
                    <Heading fontSize='18px' color={textColor} mb='16px'>
                        Características
                    </Heading>
                    <VStack align='start' spacing='12px' fontSize='sm' color='gray.600'>
                        <Flex align='center'>
                            <Box as='span' me='8px' color='green.500' fontWeight='bold'>
                                ✓
                            </Box>
                            Auto-avance al siguiente campo cuando ingresas un dígito
                        </Flex>
                        <Flex align='center'>
                            <Box as='span' me='8px' color='green.500' fontWeight='bold'>
                                ✓
                            </Box>
                            Retroceso automático al presionar Backspace
                        </Flex>
                        <Flex align='center'>
                            <Box as='span' me='8px' color='green.500' fontWeight='bold'>
                                ✓
                            </Box>
                            Soporte para pegado de códigos completos
                        </Flex>
                        <Flex align='center'>
                            <Box as='span' me='8px' color='green.500' fontWeight='bold'>
                                ✓
                            </Box>
                            Solo acepta dígitos numéricos
                        </Flex>
                        <Flex align='center'>
                            <Box as='span' me='8px' color='green.500' fontWeight='bold'>
                                ✓
                            </Box>
                            Estilos adaptativos (light/dark mode)
                        </Flex>
                        <Flex align='center'>
                            <Box as='span' me='8px' color='green.500' fontWeight='bold'>
                                ✓
                            </Box>
                            Validación visual de errores
                        </Flex>
                        <Flex align='center'>
                            <Box as='span' me='8px' color='green.500' fontWeight='bold'>
                                ✓
                            </Box>
                            Timer con cuenta regresiva (cambia a rojo cuando falta menos de 10 segundos)
                        </Flex>
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
};

export default VerificationCodeInputPreview;
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  PinInput,
  PinInputField,
  Select,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { HSeparator } from 'components/separator/Separator';
import DefaultAuth from 'layouts/auth/Default';
import illustration from 'assets/img/auth/auth.png';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaTiktok } from 'react-icons/fa';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import { getRoleRedirect, UserRole } from 'utils/auth';

type Step = 'register' | 'verify';

function SignUp() {
  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const textColorDetails = useColorModeValue('navy.700', 'secondaryGray.600');
  const textColorBrand = useColorModeValue('brand.500', 'white');
  const brandStars = useColorModeValue('brand.500', 'brand.400');
  const googleBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.200');
  const googleText = useColorModeValue('navy.700', 'white');
  const googleHover = useColorModeValue({ bg: 'gray.200' }, { bg: 'whiteAlpha.300' });
  const googleActive = useColorModeValue({ bg: 'secondaryGray.300' }, { bg: 'whiteAlpha.200' });

  const [step, setStep] = useState<Step>('register');
  const [show, setShow] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cedula, setCedula] = useState('');
  const [role, setRole] = useState<UserRole>('paciente');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp, isLoaded, setActive } = useSignUp();
  const navigate = useNavigate();

  const handleOAuth = async (strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_tiktok') => {
    if (!isLoaded) return;
    await signUp.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/auth/callback',
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
        unsafeMetadata: { role, cedula },
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Error al registrarse';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate(getRoleRedirect(role), { replace: true });
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Código inválido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <DefaultAuth illustrationBackground={illustration} image={illustration}>
        <Flex
          maxW={{ base: '100%', md: 'max-content' }}
          w='100%'
          mx={{ base: 'auto', lg: '0px' }}
          me='auto'
          h='100%'
          alignItems='start'
          justifyContent='center'
          mb={{ base: '30px', md: '60px' }}
          px={{ base: '25px', md: '0px' }}
          mt={{ base: '40px', md: '14vh' }}
          flexDirection='column'>
          <Box me='auto' mb='30px'>
            <Heading color={textColor} fontSize='36px' mb='10px'>
              Verificar correo
            </Heading>
            <Text ms='4px' color={textColorSecondary} fontWeight='400' fontSize='md'>
              Ingresa el código de 6 dígitos enviado a <b>{email}</b>
            </Text>
          </Box>
          <Flex
            zIndex='2'
            direction='column'
            w={{ base: '100%', md: '420px' }}
            maxW='100%'
            background='transparent'
            borderRadius='15px'
            mx={{ base: 'auto', lg: 'unset' }}
            me='auto'
            mb={{ base: '20px', md: 'auto' }}>
            {error && (
              <Alert status='error' borderRadius='12px' mb='20px'>
                <AlertIcon />
                {error}
              </Alert>
            )}
            <form onSubmit={handleVerify}>
              <FormControl>
                <FormLabel ms='4px' fontSize='sm' fontWeight='500' color={textColor} mb='16px'>
                  Código de verificación
                </FormLabel>
                <HStack justify='center' mb='24px'>
                  <PinInput otp size='lg' value={code} onChange={setCode}>
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                  </PinInput>
                </HStack>
                <Button
                  type='submit'
                  fontSize='sm'
                  variant='brand'
                  fontWeight='500'
                  w='100%'
                  h='50'
                  mb='24px'
                  isLoading={loading}
                  isDisabled={!isLoaded || code.length < 6}>
                  Verificar
                </Button>
              </FormControl>
            </form>
            <Text
              color={textColorBrand}
              fontSize='sm'
              fontWeight='500'
              cursor='pointer'
              textAlign='center'
              onClick={() => setStep('register')}>
              ← Volver al registro
            </Text>
          </Flex>
        </Flex>
      </DefaultAuth>
    );
  }

  return (
    <DefaultAuth illustrationBackground={illustration} image={illustration}>
      <Flex
        maxW={{ base: '100%', md: 'max-content' }}
        w='100%'
        mx={{ base: 'auto', lg: '0px' }}
        me='auto'
        h='100%'
        alignItems='start'
        justifyContent='center'
        mb={{ base: '30px', md: '60px' }}
        px={{ base: '25px', md: '0px' }}
        mt={{ base: '40px', md: '14vh' }}
        flexDirection='column'>
        <Box me='auto'>
          <Heading color={textColor} fontSize='36px' mb='10px'>
            Crear cuenta
          </Heading>
          <Text mb='36px' ms='4px' color={textColorSecondary} fontWeight='400' fontSize='md'>
            Completa tus datos para registrarte en FisioLab
          </Text>
        </Box>
        <Flex
          zIndex='2'
          direction='column'
          w={{ base: '100%', md: '420px' }}
          maxW='100%'
          background='transparent'
          borderRadius='15px'
          mx={{ base: 'auto', lg: 'unset' }}
          me='auto'
          mb={{ base: '20px', md: 'auto' }}>
          <Flex gap='12px' mb='26px'>
            <Button
              flex='1'
              py='15px'
              h='50px'
              borderRadius='16px'
              bg={googleBg}
              color={googleText}
              fontWeight='500'
              _hover={googleHover}
              _active={googleActive}
              _focus={googleActive}
              onClick={() => handleOAuth('oauth_google')}
              isDisabled={!isLoaded}>
              <Icon as={FcGoogle} w='20px' h='20px' me='8px' />
              Google
            </Button>
            <Button
              flex='1'
              py='15px'
              h='50px'
              borderRadius='16px'
              bg={googleBg}
              color='#1877F2'
              fontWeight='500'
              _hover={googleHover}
              _active={googleActive}
              _focus={googleActive}
              onClick={() => handleOAuth('oauth_facebook')}
              isDisabled={!isLoaded}>
              <Icon as={FaFacebook} w='20px' h='20px' me='8px' />
              Facebook
            </Button>
            <Button
              flex='1'
              py='15px'
              h='50px'
              borderRadius='16px'
              bg={googleBg}
              color={googleText}
              fontWeight='500'
              _hover={googleHover}
              _active={googleActive}
              _focus={googleActive}
              onClick={() => handleOAuth('oauth_tiktok')}
              isDisabled={!isLoaded}>
              <Icon as={FaTiktok} w='18px' h='18px' me='8px' />
              TikTok
            </Button>
          </Flex>
          <Flex align='center' mb='25px'>
            <HSeparator />
            <Text color='gray.400' mx='14px'>
              o
            </Text>
            <HSeparator />
          </Flex>
          {error && (
            <Alert status='error' borderRadius='12px' mb='20px'>
              <AlertIcon />
              {error}
            </Alert>
          )}
          <form onSubmit={handleRegister}>
            <FormControl>
              <Flex gap='12px' mb='24px'>
                <Box flex='1'>
                  <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' color={textColor} mb='8px'>
                    Nombre<Text color={brandStars}>*</Text>
                  </FormLabel>
                  <Input
                    isRequired
                    variant='auth'
                    fontSize='sm'
                    type='text'
                    placeholder='Juan'
                    fontWeight='500'
                    size='lg'
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Box>
                <Box flex='1'>
                  <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' color={textColor} mb='8px'>
                    Apellido<Text color={brandStars}>*</Text>
                  </FormLabel>
                  <Input
                    isRequired
                    variant='auth'
                    fontSize='sm'
                    type='text'
                    placeholder='Pérez'
                    fontWeight='500'
                    size='lg'
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Box>
              </Flex>
              <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' color={textColor} mb='8px'>
                Cédula<Text color={brandStars}>*</Text>
              </FormLabel>
              <Input
                isRequired
                variant='auth'
                fontSize='sm'
                type='text'
                placeholder='12345678'
                mb='24px'
                fontWeight='500'
                size='lg'
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
              />
              <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' color={textColor} mb='8px'>
                Rol<Text color={brandStars}>*</Text>
              </FormLabel>
              <Select
                mb='24px'
                size='lg'
                variant='auth'
                fontSize='sm'
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value='paciente'>Paciente</option>
                <option value='fisioterapeuta'>Fisioterapeuta</option>
                <option value='medico'>Médico</option>
                <option value='pasante'>Pasante</option>
                <option value='admin'>Administrador</option>
              </Select>
              <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' color={textColor} mb='8px'>
                Correo electrónico<Text color={brandStars}>*</Text>
              </FormLabel>
              <Input
                isRequired
                variant='auth'
                fontSize='sm'
                type='email'
                placeholder='tu@correo.com'
                mb='24px'
                fontWeight='500'
                size='lg'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FormLabel ms='4px' fontSize='sm' fontWeight='500' color={textColor} display='flex'>
                Contraseña<Text color={brandStars}>*</Text>
              </FormLabel>
              <InputGroup size='md'>
                <Input
                  isRequired
                  fontSize='sm'
                  placeholder='Mínimo 8 caracteres'
                  mb='24px'
                  size='lg'
                  type={show ? 'text' : 'password'}
                  variant='auth'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputRightElement display='flex' alignItems='center' mt='4px'>
                  <Icon
                    color={textColorSecondary}
                    _hover={{ cursor: 'pointer' }}
                    as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    onClick={() => setShow(!show)}
                  />
                </InputRightElement>
              </InputGroup>
              <Button
                type='submit'
                fontSize='sm'
                variant='brand'
                fontWeight='500'
                w='100%'
                h='50'
                mb='24px'
                isLoading={loading}
                isDisabled={!isLoaded}>
                Crear cuenta
              </Button>
            </FormControl>
          </form>
          <Flex flexDirection='column' justifyContent='center' alignItems='start' maxW='100%' mt='0px'>
            <Text color={textColorDetails} fontWeight='400' fontSize='14px'>
              ¿Ya tienes una cuenta?
              <NavLink to='/auth/sign-in'>
                <Text color={textColorBrand} as='span' ms='5px' fontWeight='500'>
                  Iniciar sesión
                </Text>
              </NavLink>
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}

export default SignUp;

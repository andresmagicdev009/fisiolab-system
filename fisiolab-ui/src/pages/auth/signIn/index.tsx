import React, { useState } from 'react';
import { NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useSignIn, useUser } from '@clerk/clerk-react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  useDisclosure,
} from '@chakra-ui/react';
import { HSeparator } from 'components/separator/Separator';
import DefaultAuth from 'components/layouts/auth/Default';
import CustomModal from 'components/modal/Modal';
import illustration from 'assets/img/auth/auth.jpg';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaTiktok } from 'react-icons/fa';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import { getRoleRedirect, getUserRole } from 'utils/auth';

function SignIn() {
  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const textColorDetails = useColorModeValue('navy.700', 'secondaryGray.600');
  const textColorBrand = useColorModeValue('brand.500', 'white');
  const brandStars = useColorModeValue('brand.500', 'brand.400');
  const googleBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.200');
  const googleText = useColorModeValue('navy.700', 'white');
  const googleHover = useColorModeValue({ bg: 'gray.200' }, { bg: 'whiteAlpha.300' });
  const googleActive = useColorModeValue({ bg: 'secondaryGray.300' }, { bg: 'whiteAlpha.200' });

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal de cambio de contraseña
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [resetStep, setResetStep] = useState<'send' | 'confirm'>('send');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { signIn, isLoaded, setActive } = useSignIn();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();

  if (userLoaded && isSignedIn && user) {
    return <Navigate to={getRoleRedirect(getUserRole(user))} replace />;
  }

  const handleOAuth = async (strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_tiktok') => {
    if (!isLoaded) return;
    await signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/auth/callback',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate(getRoleRedirect(getUserRole(user)), { replace: true });
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const isPwned =
        clerkError?.code === 'form_password_pwned' ||
        clerkError?.message?.toLowerCase().includes('data breach') ||
        clerkError?.longMessage?.toLowerCase().includes('data breach');

      if (isPwned) {
        // Iniciar flujo reset: enviar código al email
        try {
          await signIn.create({
            strategy: 'reset_password_email_code',
            identifier: email,
          });
          setResetStep('send');
          onOpen();
        } catch {
          setError('Contraseña comprometida. No se pudo enviar el correo de recuperación.');
        }
      } else {
        const msg = clerkError?.longMessage ?? clerkError?.message ?? 'Error al iniciar sesión';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isLoaded) return;
    if (newPassword !== newPasswordConfirm) {
      setResetError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      setResetError('Mínimo 8 caracteres.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        onClose();
        navigate(getRoleRedirect(getUserRole(user)), { replace: true });
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Error al cambiar contraseña';
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseModal = () => {
    onClose();
    setResetCode('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setResetError('');
    setResetStep('send');
  };

  return (
    <DefaultAuth illustrationBackground={illustration} image={illustration}>
      <>
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
              Iniciar Sesión
            </Heading>
            <Text mb='36px' ms='4px' color={textColorSecondary} fontWeight='400' fontSize='md'>
              Ingresa tu correo y contraseña para continuar
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
            <form onSubmit={handleSubmit}>
              <FormControl>
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
                <Flex justifyContent='space-between' align='center' mb='24px'>
                  <FormControl display='flex' alignItems='center'>
                    <Checkbox id='remember-login' colorScheme='brandScheme' me='10px' />
                    <FormLabel htmlFor='remember-login' mb='0' fontWeight='normal' color={textColor} fontSize='sm'>
                      Mantenerme conectado
                    </FormLabel>
                  </FormControl>
                  <NavLink to='/auth/forgot-password'>
                    <Text color={textColorBrand} fontSize='sm' w='124px' fontWeight='500'>
                      ¿Olvidaste tu contraseña?
                    </Text>
                  </NavLink>
                </Flex>
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
                  Iniciar Sesión
                </Button>
              </FormControl>
            </form>
          </Flex>
        </Flex>

        {/* Modal cambio de contraseña obligatorio - REUTILIZANDO CustomModal */}
        <CustomModal
          isOpen={isOpen}
          onClose={handleCloseModal}
          title='Cambio de contraseña requerido'
          size='md'
          primaryBtnLabel='Cambiar contraseña'
          secondaryBtnLabel='Cancelar'
          onPrimaryClick={handleResetPassword}
          primaryBtnLoading={resetLoading}
          primaryBtnDisabled={!resetCode || !newPassword || !newPasswordConfirm}
          closeOnOverlayClick={false}>
          
            <Text
              fontSize='sm'
              color='gray.600'
              bg='orange.50'
              border='1px solid'
              borderColor='orange.200'
              borderRadius='10px'
              px='14px'
              py='12px'
              mb='16px'
              lineHeight='1.6'>
              Se ha enviado un código de verificación a tu correo electrónico. Por favor, ingresa el código.
            </Text>

        

          {resetError && (
            <Alert status='error' borderRadius='10px' mb='16px' fontSize='sm'>
              <AlertIcon />
              {resetError}
            </Alert>
          )}

          <FormControl mb='16px'>
            <FormLabel fontSize='sm' fontWeight='500'>
              Código de verificación
            </FormLabel>
            <Input
              placeholder='Revisa tu correo electrónico'
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              size='lg'
              borderRadius='10px'
            />
          </FormControl>

          <FormControl mb='16px'>
            <FormLabel fontSize='sm' fontWeight='500'>
              Nueva contraseña
            </FormLabel>
            <InputGroup size='lg'>
              <Input
                placeholder='Mínimo 8 caracteres'
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                borderRadius='10px'
              />
              <InputRightElement display='flex' alignItems='center'>
                <Icon
                  color='gray.400'
                  _hover={{ cursor: 'pointer' }}
                  as={showNew ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                  onClick={() => setShowNew(!showNew)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <FormControl>
            <FormLabel fontSize='sm' fontWeight='500'>
              Confirmar nueva contraseña
            </FormLabel>
            <Input
              placeholder='Repite la contraseña'
              type='password'
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              size='lg'
              borderRadius='10px'
            />
          </FormControl>
        </CustomModal>
      </>

    </DefaultAuth>
  );
}

export default SignIn;
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSignIn, useUser } from '@clerk/clerk-react';
import {
  Box,
  Button,
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
  VStack,
  HStack,
} from '@chakra-ui/react';
import DefaultAuth from 'components/layouts/auth/Default';
import illustration from 'assets/img/auth/auth.jpg';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import VerificationCodeInput from 'components/fields/VerificationCodeInput';
import Timer from 'components/fields/Timer';
import { getRoleRedirect, getUserRole } from 'utils/auth';

type Step = 'request' | 'verify' | 'reset';

function ForgotPassword() {
  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const textColorBrand = useColorModeValue('brand.500', 'white');
  const brandStars = useColorModeValue('brand.500', 'brand.400');
  const bgColor = useColorModeValue('white', 'navy.800');

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);

  const { signIn, isLoaded, setActive } = useSignIn();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setCodeExpired(false);
      setStep('verify');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Error al enviar el código';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    setCodeError('');
    setError('');
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setCodeExpired(false);
      setCode('');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Error al reenviar el código';
      setError(msg);
    }
  };

  const handleVerifyCode = () => {
    if (code.length !== 6) return;
    setCodeError('');
    setStep('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mínimo 8 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    setCodeError('');
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate(getRoleRedirect(getUserRole(user)), { replace: true });
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      if (clerkError?.code === 'form_code_incorrect') {
        setStep('verify');
        setCodeError('Código incorrecto. Verifica e intenta de nuevo.');
      } else {
        const msg = clerkError?.longMessage ?? clerkError?.message ?? 'Error al restablecer la contraseña';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

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

        {step !== 'verify' && (
          <Box me='auto' mb='30px'>
            <Heading color={textColor} fontSize='36px' mb='10px'>
              {step === 'request' && 'Recuperar contraseña'}
              {step === 'reset' && 'Nueva contraseña'}
            </Heading>
            <Text color={textColorSecondary} fontWeight='400' fontSize='md'>
              {step === 'request' && 'Ingresa tu correo y te enviaremos un código de verificación.'}
              {step === 'reset' && 'Ingresa tu nueva contraseña para continuar.'}
            </Text>
          </Box>
        )}

        <Flex
          direction='column'
          w={{ base: '100%', md: '420px' }}
          maxW='100%'
          mx={{ base: 'auto', lg: 'unset' }}
          me='auto'>

          {error && (
            <Alert status='error' borderRadius='7px' boxShadow='sm' mb='20px'>
              <AlertIcon />
              {error}
            </Alert>
          )}

          {/* Step 1 — Email */}
          {step === 'request' && (
            <form onSubmit={handleRequestCode}>
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
                  borderRadius='7px'
                  boxShadow='sm'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  type='submit'
                  fontSize='sm'
                  variant='brand'
                  fontWeight='500'
                  w='100%'
                  h='50px'
                  mb='16px'
                  borderRadius='7px'
                  boxShadow='sm'
                  isLoading={loading}
                  isDisabled={!isLoaded}>
                  Enviar código
                </Button>
                <NavLink to='/auth/sign-in'>
                  <Text color={textColorBrand} fontSize='sm' fontWeight='500' textAlign='center'>
                    Volver al inicio de sesión
                  </Text>
                </NavLink>
              </FormControl>
            </form>
          )}

          {/* Step 2 — Verificar código */}
          {step === 'verify' && (
            <Box bg={bgColor} p='32px' borderRadius='7px' boxShadow='sm' maxW='500px' mx='auto'>
              <VStack spacing='24px' align='stretch'>
                <Box textAlign='center' mb='8px'>
                  <Heading fontSize='36px' fontWeight='700' color={textColor} mb='8px'>
                    Ingresa el código de verificación
                  </Heading>
                  <Text fontSize='sm' color={textColorSecondary}>
                    Se envió un código de 6 dígitos a{' '}
                    <Text as='span' fontWeight='600' color={textColorBrand}>
                      {email}
                    </Text>
                  </Text>
                </Box>
                <VerificationCodeInput
                  value={code}
                  onChange={setCode}
                  label=''
                  helperText=''
                  error={codeExpired ? 'El código ha expirado. Reenvía uno nuevo.' : codeError}
                  isDisabled={codeExpired}
                />

                <HStack justify='space-between' w='100%'>
                  {!codeExpired ? (
                    <Timer seconds={120} onExpire={() => setCodeExpired(true)} />
                  ) : (
                    <Text fontSize='sm' color='red.500' fontWeight='500'>
                      Código expirado
                    </Text>
                  )}
                  <Text
                    fontSize='sm'
                    color='brand.500'
                    fontWeight='600'
                    _hover={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={handleResendCode}>
                    Reenviar código
                  </Text>
                </HStack>

                <Button
                  w='100%'
                  variant='brand'
                  fontSize='sm'
                  fontWeight='500'
                  h='50px'
                  borderRadius='7px'
                  boxShadow='sm'
                  onClick={handleVerifyCode}
                  isDisabled={code.length !== 6 || codeExpired}>
                  Verificar
                </Button>
              </VStack>
            </Box>
          )}

          {/* Step 3 — Nueva contraseña */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <FormControl>
                <FormLabel ms='4px' fontSize='sm' fontWeight='500' color={textColor} display='flex' mb='8px'>
                  Nueva contraseña<Text color={brandStars}>*</Text>
                </FormLabel>
                <InputGroup size='md' mb='16px'>
                  <Input
                    isRequired
                    fontSize='sm'
                    placeholder='Mínimo 8 caracteres'
                    size='lg'
                    type={showPass ? 'text' : 'password'}
                    variant='auth'
                    borderRadius='7px'
                    boxShadow='sm'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <InputRightElement display='flex' alignItems='center' mt='4px'>
                    <Icon
                      color={textColorSecondary}
                      _hover={{ cursor: 'pointer' }}
                      as={showPass ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                      onClick={() => setShowPass(!showPass)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormLabel ms='4px' fontSize='sm' fontWeight='500' color={textColor} display='flex' mb='8px'>
                  Confirmar contraseña<Text color={brandStars}>*</Text>
                </FormLabel>
                <Input
                  isRequired
                  variant='auth'
                  fontSize='sm'
                  placeholder='Repite la contraseña'
                  mb='24px'
                  size='lg'
                  type='password'
                  borderRadius='7px'
                  boxShadow='sm'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type='submit'
                  fontSize='sm'
                  variant='brand'
                  fontWeight='500'
                  w='100%'
                  h='50px'
                  borderRadius='7px'
                  boxShadow='sm'
                  isLoading={loading}
                  isDisabled={!isLoaded}>
                  Cambiar contraseña
                </Button>
              </FormControl>
            </form>
          )}
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}

export default ForgotPassword;

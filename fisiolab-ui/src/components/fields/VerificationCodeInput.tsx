import React, { useRef, useEffect } from 'react';

import {
    Box,
    FormControl,
    FormLabel,
    Flex,
    Input,
    Text,
    useColorModeValue,
    VStack,
    HStack,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';

interface VerificationCodeInputProps {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    label?: string;
    placeholder?: string;
    error?: string;
    helperText?: string;
    isDisabled?: boolean;
    isCentered?: boolean; // Sirve para centrar el texto dentro de los inputs
}

export default function VerificationCodeInput({
    value,
    onChange,
    length = 6,
    label = 'Código de verificación',
    placeholder = '0',
    error,
    helperText = 'Se ha enviado un código a tu correo electrónico',
    isDisabled = false,
    isCentered = true,
}: VerificationCodeInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const borderColor = useColorModeValue('secondaryGray.200', 'whiteAlpha.200');
    const focusBorderColor = useColorModeValue('brand.500', 'brand.400');
    const errorBorderColor = 'red.500';
    const helperTextColor = useColorModeValue('gray.600', 'gray.400');

    const codeArray = value.split('').slice(0, length);

    const handleInputChange = (index: number, digit: string) => {
        // Solo acepta números
        if (!/^\d*$/.test(digit)) return;

        const newCode = value.split('');
        newCode[index] = digit;
        onChange(newCode.slice(0, length).join(''));

        // Pasar al siguiente input automáticamente
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (value[index]) {
                // Si hay valor en el input actual, borrarlo
                const newCode = value.split('');
                newCode[index] = '';
                onChange(newCode.join(''));
            } else if (index > 0) {
                // Si está vacío, ir al anterior
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
        if (pasteData) {
            onChange(pasteData.slice(0, length));
            e.preventDefault();
        }
    };


    return (
    <FormControl isInvalid={!!error} isDisabled={isDisabled}>
      <VStack align={isCentered ? 'center' : 'start'} spacing='32px' w='100%'>
        <FormLabel fontSize='lg' fontWeight='600' color='navy.700' mb='0'>
          {label}
        </FormLabel>

        {helperText && !error && (
          <Text fontSize='sm' color={helperTextColor} lineHeight='1.5'>
            {helperText}
          </Text>
        )}

        <HStack spacing='8px' w='100%' justify='center'>
          {Array.from({ length }).map((_, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type='text'
              inputMode='numeric'
              maxLength={1}
              value={codeArray[index] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              placeholder={placeholder}
              textAlign='center'
              fontSize='20px'
              fontWeight='600'
              h='54px'
              w='54px'
              borderRadius='7px'
              border='2px solid'
              borderColor={error ? errorBorderColor : borderColor}
              _focus={{
                borderColor: error ? errorBorderColor : focusBorderColor,
                boxShadow: `0 0 0 3px ${
                  error
                    ? 'rgba(245, 101, 101, 0.1)'
                    : 'rgba(69, 90, 229, 0.1)'
                }`,
              }}
              _placeholder={{ color: 'gray.400' }}
              isDisabled={isDisabled}
              transition='all 0.2s'
            />
          ))}
        </HStack>

        {error && (
          <Alert status='error' borderRadius='8px' fontSize='sm' variant='left-accent'>
            <AlertIcon />
            {error}
          </Alert>
        )}
      </VStack>
    </FormControl>
  );
}
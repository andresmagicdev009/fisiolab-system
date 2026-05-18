import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputProps,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';

interface FormFieldProps extends Omit<InputProps, 'type'> {
  id: string;
  label: string;
  extra?: React.ReactNode;
  placeholder?: string;
  type?: string;
  mb?: string | number | object;
  errorMessage?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ id, label, extra, placeholder, type = 'text', mb, errorMessage, isInvalid, ...rest }, ref) => {
    const textColorPrimary = useColorModeValue('secondaryGray.900', 'white');

    return (
      <FormControl isInvalid={isInvalid} mb={mb ?? '20px'}>
        <FormLabel
          display='flex'
          ms='10px'
          htmlFor={id}
          fontSize='sm'
          color={textColorPrimary}
          fontWeight='bold'
          _hover={{ cursor: 'pointer' }}>
          {label}
          {extra && (
            <Text fontSize='sm' fontWeight='400' ms='2px'>
              {extra}
            </Text>
          )}
        </FormLabel>
        <Input
          {...rest}
          ref={ref}
          type={type}
          id={id}
          fontWeight='500'
          variant='main'
          placeholder={placeholder}
          _placeholder={{ fontWeight: '400', color: 'secondaryGray.600' }}
          h='44px'
          maxH='44px'
        />
        {isInvalid && errorMessage && (
          <FormErrorMessage ms='10px'>{errorMessage}</FormErrorMessage>
        )}
      </FormControl>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;

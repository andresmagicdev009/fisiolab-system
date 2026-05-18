import { Button as ChakraButton } from '@chakra-ui/react';

export default function Button({
  children,
  leftIcon = undefined,
  rightIcon = undefined,
  onClick = undefined,
  isLoading = false,
  isDisabled = false,
  variant = 'brand',
  size = 'md',
  type = 'button',
  form = undefined,
  ...rest
}) {
  return (
    <ChakraButton
      variant={variant}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      onClick={onClick}
      isLoading={isLoading}
      isDisabled={isDisabled}
      type={type}
      form={form}
      fontWeight='700'
      fontSize='sm'
      borderRadius='16px'
      h='44px'
      px='24px'
      size={size}
      _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(66, 42, 251, 0.25)' }}
      _active={{ transform: 'translateY(0px)' }}
      transition='all 0.2s ease'
      {...rest}>
      {children}
    </ChakraButton>
  );
}

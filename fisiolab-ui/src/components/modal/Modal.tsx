import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Flex,
} from '@chakra-ui/react';
import Button from 'components/ui/Button';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  primaryBtnLabel?: string;
  secondaryBtnLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  primaryBtnLoading?: boolean;
  secondaryBtnLoading?: boolean;
  primaryBtnDisabled?: boolean;
  secondaryBtnDisabled?: boolean;
  hideFooter?: boolean;
  closeOnOverlayClick?: boolean;
  headerExtra?: React.ReactNode;
}

export default function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  primaryBtnLabel = 'Guardar',
  secondaryBtnLabel = 'Cancelar',
  onPrimaryClick,
  onSecondaryClick,
  primaryBtnLoading = false,
  secondaryBtnLoading = false,
  primaryBtnDisabled = false,
  secondaryBtnDisabled = false,
  hideFooter = false,
  closeOnOverlayClick = true,
  headerExtra,
}: ModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      isCentered
      blockScrollOnMount={false}
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        {(title || headerExtra) && (
          <ModalHeader
            fontSize="lg"
            fontWeight="700"
            color="navy.800"
            borderBottom="1px solid"
            borderColor="secondaryGray.100"
            pr="48px"
          >
            <Flex align="center" justify="space-between" gap="16px">
              {title && <Box flexShrink={0}>{title}</Box>}
              {headerExtra && <Box flex="1">{headerExtra}</Box>}
            </Flex>
          </ModalHeader>
        )}
        <ModalCloseButton />
        
        <ModalBody py="24px">
          {children}
        </ModalBody>

        {!hideFooter && (
          <ModalFooter
            gap="12px"
            borderTop="1px solid"
            borderColor="secondaryGray.100"
            pt="16px"
          >
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={() => {
                onSecondaryClick?.();
                onClose();
              }}
              isDisabled={secondaryBtnDisabled}
              isLoading={secondaryBtnLoading}
              fontWeight="600"
            >
              {secondaryBtnLabel}
            </Button>
            <Button
              bg="brand.500"
              color="white"
              _hover={{ bg: 'brand.600' }}
              onClick={onPrimaryClick}
              isDisabled={primaryBtnDisabled}
              isLoading={primaryBtnLoading}
              fontWeight="600"
            >
              {primaryBtnLabel}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
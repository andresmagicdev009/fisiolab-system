import React from 'react';
import { Flex, Text, Link } from '@chakra-ui/react';

export const FooterOnBoarding: React.FC = () => (
  <Flex
    direction="column"
    alignItems="center"
    gap="4px"
    py="16px"
    borderTop="1px solid"
    borderColor="secondaryGray.100"
    w="100%"
  >
    <Text fontSize="11px" color="secondaryGray.500" textAlign="center">
      Hecho con amor por{' '}
      <Text as="span" fontWeight="700" color="navy.800">
        MagicDev
      </Text>
    </Text>
    <Flex gap="12px" alignItems="center">
      <Link
        href="https://clerk.com"
        isExternal
        fontSize="10px"
        color="secondaryGray.400"
        _hover={{ color: 'secondaryGray.700' }}
        fontWeight="500"
      >
        Powered by Clerk
      </Link>
      <Text fontSize="10px" color="secondaryGray.200">·</Text>
      <Link
        href="https://horizon-ui.com"
        isExternal
        fontSize="10px"
        color="secondaryGray.400"
        _hover={{ color: 'secondaryGray.700' }}
        fontWeight="500"
      >
        UI by Horizon UI
      </Link>
    </Flex>
  </Flex>
);

export default FooterOnBoarding;

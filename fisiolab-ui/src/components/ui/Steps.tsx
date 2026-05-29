import { Fragment } from 'react';
import { Flex, Box, Text, Icon, useColorModeValue } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: IconType;
}

export interface StepsProps {
  steps: Step[];
  activeStep: number;
  onStepChange?: (stepIndex: number) => void;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: string;
  labelPlacement?: 'right' | 'bottom';
}

export default function Steps({
  steps,
  activeStep,
  onStepChange,
  size = 'md',
  colorScheme = 'brand',
  labelPlacement = 'bottom',
}: StepsProps) {
  const activeStepBg = `${colorScheme}.500`;
  const inactiveStepBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const inactiveStepBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('secondaryGray.500', 'secondaryGray.400');

  const sizeConfig = {
    sm: { indicator: '28px', iconSize: '14px', dotSize: '10px', fontSize: 'xs', descSize: '10px', gap: '8px',  connectorW: '32px' },
    md: { indicator: '36px', iconSize: '18px', dotSize: '14px', fontSize: 'sm', descSize: 'xs',   gap: '12px', connectorW: '40px' },
    lg: { indicator: '44px', iconSize: '22px', dotSize: '18px', fontSize: 'md', descSize: 'sm',   gap: '16px', connectorW: '48px' },
  };

  const config = sizeConfig[size];
  const isCompleted = (index: number) => index < activeStep;
  const isActive = (index: number) => index === activeStep;

  const renderIndicator = (step: Step, index: number) => (
    <Flex
      w={config.indicator}
      h={config.indicator}
      flexShrink={0}
      bg={isActive(index) || isCompleted(index) ? activeStepBg : inactiveStepBg}
      borderRadius='50%'
      align='center'
      justify='center'
      cursor={onStepChange ? 'pointer' : 'default'}
      border='2px solid'
      borderColor={isActive(index) || isCompleted(index) ? activeStepBg : inactiveStepBorder}
      boxShadow={isActive(index) ? `0 0 0 4px var(--chakra-colors-${colorScheme}-100)` : 'none'}
      transition='all 0.3s ease'
      _hover={onStepChange ? { opacity: 0.8, transform: 'scale(1.05)' } : {}}
      onClick={() => onStepChange?.(index)}>
      {isActive(index) ? (
        <Box w={config.dotSize} h={config.dotSize} bg='white' borderRadius='50%' />
      ) : isCompleted(index) ? (
        step.icon
          ? <Icon as={step.icon} color='white' w={config.iconSize} h={config.iconSize} />
          : <Icon as={Check} color='white' w={config.iconSize} h={config.iconSize} />
      ) : null}
    </Flex>
  );

  const renderLabel = (step: Step, index: number, align: 'left' | 'center') => (
    <Flex direction='column' minW={0} overflow='hidden' align={align === 'center' ? 'center' : 'flex-start'}>
      <Text
        fontSize={config.fontSize}
        fontWeight={isActive(index) ? '700' : '600'}
        color={isActive(index) ? activeStepBg : isCompleted(index) ? textColor : mutedColor}
        noOfLines={1}
        textAlign={align}>
        {step.title}
      </Text>
      {step.description && (
        <Text fontSize={config.descSize} color={mutedColor} noOfLines={1} textAlign={align}>
          {step.description}
        </Text>
      )}
    </Flex>
  );

  // ── Layout: texto a la derecha ────────────────────────────────────────────
  if (labelPlacement === 'right') {
    return (
      <Flex width='100%' align='center' role='list'>
        {steps.map((step, index) => (
          <Fragment key={step.id}>
            <Flex direction='row' align='center' flex='1' minW={0}>
              {renderIndicator(step, index)}
              <Box ml={config.gap} minW={0} overflow='hidden'>
                {renderLabel(step, index, 'left')}
              </Box>
            </Flex>
            {index < steps.length - 1 && (
              <Box
                flexShrink={0}
                w={config.connectorW}
                height='2px'
                bg={activeStepBg}
                opacity={isCompleted(index + 1) ? 1 : 0.2}
                mx={config.gap}
                transition='background 0.3s ease'
              />
            )}
          </Fragment>
        ))}
      </Flex>
    );
  }

  // ── Layout: texto debajo ──────────────────────────────────────────────────
  return (
    <Flex width='100%' align='flex-start' role='list'>
      {steps.map((step, index) => (
        <Flex key={step.id} direction='column' align='center' flex='1' position='relative'>
          {index < steps.length - 1 && (
            <Box
              position='absolute'
              top={`calc(${config.indicator} / 2 - 1px)`}
              left={`calc(50% + ${config.indicator} / 2)`}
              width={`calc(100% - ${config.indicator})`}
              height='2px'
              bg={activeStepBg}
              opacity={isCompleted(index + 1) ? 1 : 0.2}
              transition='background 0.3s ease'
              zIndex={0}
            />
          )}
          <Box position='relative' zIndex={1}>
            {renderIndicator(step, index)}
          </Box>
          <Box mt={config.gap} w='100%' px='4px'>
            {renderLabel(step, index, 'center')}
          </Box>
        </Flex>
      ))}
    </Flex>
  );
}

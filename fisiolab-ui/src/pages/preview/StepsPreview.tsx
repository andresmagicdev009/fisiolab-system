import { useState } from 'react';
import { Flex, Box, Text, VStack, Center, Button, useColorModeValue } from '@chakra-ui/react';
import Steps, { Step } from 'components/ui/Steps';

const SAMPLE_STEPS: Step[] = [
  { id: '1', title: 'Step 1', description: 'Description' },
  { id: '2', title: 'Step 2', description: 'Description' },
  { id: '3', title: 'Step 3', description: 'Description' },
  { id: '4', title: 'Step 4', description: 'Description' },
];

export default function StepsPreview() {
  const [activeStep, setActiveStep] = useState(1);
  const bg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Center minH='100vh' bg={bg} p='40px'>
      <VStack spacing='48px' w='100%' maxW='700px'>
        <Text fontSize='xl' fontWeight='700'>Steps — Preview</Text>

        <Text fontSize='sm' fontWeight='700' alignSelf='flex-start' color='gray.600'>labelPlacement="right"</Text>

        {(['sm', 'md', 'lg'] as const).map((s) => (
          <VStack key={s} spacing='8px' w='100%' align='flex-start'>
            <Text fontSize='xs' fontWeight='600' color='gray.400' textTransform='uppercase'>{s}</Text>
            <Steps steps={SAMPLE_STEPS} activeStep={activeStep} onStepChange={setActiveStep} size={s} labelPlacement='right' />
          </VStack>
        ))}

        <Box w='100%' h='1px' bg='gray.200' />

        <Text fontSize='sm' fontWeight='700' alignSelf='flex-start' color='gray.600'>labelPlacement="bottom"</Text>

        {(['sm', 'md', 'lg'] as const).map((s) => (
          <VStack key={s} spacing='8px' w='100%' align='flex-start'>
            <Text fontSize='xs' fontWeight='600' color='gray.400' textTransform='uppercase'>{s}</Text>
            <Steps steps={SAMPLE_STEPS} activeStep={activeStep} onStepChange={setActiveStep} size={s} labelPlacement='bottom' />
          </VStack>
        ))}

        <Flex gap='12px'>
          <Button size='sm' onClick={() => setActiveStep((s) => Math.max(0, s - 1))}>Anterior</Button>
          <Button size='sm' colorScheme='brand' onClick={() => setActiveStep((s) => Math.min(SAMPLE_STEPS.length - 1, s + 1))}>
            Siguiente
          </Button>
        </Flex>
      </VStack>
    </Center>
  );
}

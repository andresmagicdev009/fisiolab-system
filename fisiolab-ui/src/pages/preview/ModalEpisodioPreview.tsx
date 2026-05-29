import { useState } from 'react';
import {
  Center,
  VStack,
  HStack,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import CustomModal from 'components/modal/Modal';
import Steps, { Step } from 'components/ui/Steps';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const EPISODE_STEPS: Step[] = [
  { id: '1', title: 'Apertura' },
  { id: '2', title: 'Evaluación' },
  { id: '3', title: 'Tratamiento' },
  { id: '4', title: 'Cierre' },
];

const SIZES: ModalSize[] = ['sm', 'md', 'lg', 'xl', '2xl'];

export default function ModalEpisodioPreview() {
  const [openSize, setOpenSize] = useState<ModalSize | null>(null);
  const bg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Center minH='100vh' bg={bg}>
      <VStack spacing='6'>
        <Text fontSize='xl' fontWeight='700'>Modal Episodio — Preview</Text>

        <HStack spacing='3' flexWrap='wrap' justify='center'>
          {SIZES.map((s) => (
            <Button key={s} size='sm' colorScheme='brand' onClick={() => setOpenSize(s)}>
              {s.toUpperCase()}
            </Button>
          ))}
        </HStack>
      </VStack>

      <CustomModal
        isOpen={openSize !== null}
        onClose={() => setOpenSize(null)}
        title='Nuevo Episodio Clínico'
        size={openSize ?? 'md'}
        primaryBtnLabel='Abrir Episodio'
        onPrimaryClick={() => setOpenSize(null)}
        headerExtra={
          <Steps steps={EPISODE_STEPS} activeStep={0} size='sm' labelPlacement='bottom' />
        }
      >
        <VStack spacing='20px' align='stretch'>
          <FormControl>
            <FormLabel fontSize='sm' fontWeight='600'>Motivo de consulta</FormLabel>
            <Textarea
              placeholder='Describe el motivo principal de consulta...'
              rows={3}
              resize='none'
              fontSize='sm'
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize='sm' fontWeight='600'>Notas de apertura</FormLabel>
            <Textarea
              placeholder='Observaciones iniciales, antecedentes relevantes...'
              rows={4}
              resize='none'
              fontSize='sm'
            />
          </FormControl>
        </VStack>
      </CustomModal>
    </Center>
  );
}

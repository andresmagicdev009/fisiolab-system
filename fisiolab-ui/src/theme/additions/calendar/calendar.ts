import { mode } from '@chakra-ui/theme-tools';

const MiniCalendar = {
  baseStyle: (props: any) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 'max-content',
    padding: '20px 15px',
    height: 'max-content',
    borderRadius: '20px',
    bg: mode('white', 'navy.800')(props),
    boxShadow: mode(
      '14px 17px 40px 4px rgba(112, 144, 176, 0.18)',
      'unset',
    )(props),
  }),
};

export const CalendarComponent = {
  components: {
    MiniCalendar,
  },
};

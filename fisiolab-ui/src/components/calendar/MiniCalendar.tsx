import { useState } from 'react';
import Calendar from 'react-calendar';

type Value = Date | null | [Date | null, Date | null];
import 'react-calendar/dist/Calendar.css';
import 'assets/css/MiniCalendar.css';
import { Flex, Text, Icon, useStyleConfig } from '@chakra-ui/react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

interface MiniCalendarProps {
  selectRange?: boolean;
  onChange?: (value: Value) => void;
  value?: Value;
  [x: string]: any;
}

export default function MiniCalendar({
  selectRange = false,
  onChange,
  value: controlledValue,
  ...rest
}: MiniCalendarProps) {
  const styles = useStyleConfig('MiniCalendar', rest);
  const [internalValue, setInternalValue] = useState<Value>(new Date());

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (val: Value, _event: React.MouseEvent<HTMLButtonElement>) => {
    setInternalValue(val);
    onChange?.(val);
  };

  return (
    <Flex __css={styles} {...rest}>
      <Calendar
        onChange={handleChange}
        value={value}
        selectRange={selectRange}
        view="month"
        tileContent={<Text color="brand.500" />}
        prevLabel={<Icon as={MdChevronLeft} w="24px" h="24px" mt="4px" />}
        nextLabel={<Icon as={MdChevronRight} w="24px" h="24px" mt="4px" />}
      />
    </Flex>
  );
}

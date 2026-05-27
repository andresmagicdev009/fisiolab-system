import React, { useState, useRef, useEffect } from 'react';
import { Box, Input } from '@chakra-ui/react';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface TimeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  listMaxH?: string;
  flex?: number | string;
  w?: string;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const TimeCombobox: React.FC<TimeComboboxProps> = ({
  value,
  onChange,
  options,
  listMaxH = '170px',
  flex,
  w,
}) => {
  const [inputVal, setInputVal] = useState(value);
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInputVal(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputVal(v);
    setFiltered(v ? options.filter(o => o.startsWith(v)) : options);
    setOpen(true);
  };

  const handleSelect = (opt: string) => {
    setInputVal(opt);
    onChange(opt);
    setOpen(false);
  };

  const handleBlur = () => {
    if (TIME_RE.test(inputVal)) {
      onChange(inputVal);
    } else {
      setInputVal(value);
    }
    setTimeout(() => setOpen(false), 150);
  };

  const handleFocus = () => {
    setFiltered(options);
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && TIME_RE.test(inputVal)) {
      onChange(inputVal);
      setOpen(false);
    } else if (e.key === 'Escape') {
      setInputVal(value);
      setOpen(false);
    }
  };

  return (
    <Box ref={containerRef} position="relative" flex={flex} w={w} minW="0">
      <Input
        value={inputVal}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        size="sm"
        textAlign="center"
        fontWeight="500"
        fontSize="13px"
        borderRadius="6px"
        px="6px"
        autoComplete="off"
        spellCheck={false}
      />
      {open && filtered.length > 0 && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          right="0"
          zIndex={1500}
          bg="white"
          border="1px solid"
          borderColor="secondaryGray.100"
          borderRadius="8px"
          boxShadow="0 4px 16px rgba(0,0,0,0.10)"
          overflow="hidden"
        >
          <Scrollbars
            autoHeight
            autoHeightMax={listMaxH}
            renderTrackVertical={({ style, ...props }) => (
              <div {...props} style={{ ...style, width: 4, right: 2, top: 2, bottom: 2, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }} />
            )}
            renderThumbVertical={({ style, ...props }) => (
              <div {...props} style={{ ...style, borderRadius: 3, background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }} />
            )}
            renderView={({ style, ...props }) => (
              <div {...props} style={{ ...style, marginBottom: 0 }} />
            )}
          >
            {filtered.map(opt => (
              <Box
                key={opt}
                px="12px"
                py="7px"
                fontSize="13px"
                fontWeight="500"
                cursor="pointer"
                color="secondaryGray.900"
                bg={opt === value ? 'brand.100' : 'transparent'}
                _hover={{ bg: 'secondaryGray.300' }}
                onMouseDown={() => handleSelect(opt)}
              >
                {opt}
              </Box>
            ))}
          </Scrollbars>
        </Box>
      )}
    </Box>
  );
};

export default TimeCombobox;

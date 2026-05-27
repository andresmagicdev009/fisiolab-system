import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  ButtonProps,
  Icon,
} from '@chakra-ui/react';
import { MdExpandMore } from 'react-icons/md';
import { Scrollbars } from 'react-custom-scrollbars-2';

export interface DropdownItem {
  label: string;
  value: string | number;
  onClick?: () => void;
  isDisabled?: boolean;
  isDanger?: boolean;
}

export interface DropdownProps extends Omit<ButtonProps, 'onSelect'> {
  label?: string;
  items: DropdownItem[];
  onSelect?: (value: string | number) => void;
  showIcon?: boolean;
  icon?: React.ReactNode;
  borderRadius?: string | number;
  padding?: string | number;
  listMaxH?: string | number;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label = 'Opciones',
  items,
  onSelect,
  showIcon = true,
  icon,
  borderRadius = '8px',
  padding = '10px 16px',
  listMaxH,
  ...buttonProps
}) => {
  const handleItemClick = (item: DropdownItem) => {
    if (item.onClick) item.onClick();
    onSelect?.(item.value);
  };

  const menuItems = items.map((item, index) => (
    <React.Fragment key={item.value}>
      <MenuItem
        onClick={() => handleItemClick(item)}
        isDisabled={item.isDisabled}
        color={item.isDanger ? 'red.500' : 'inherit'}
        _hover={item.isDanger ? { bg: 'red.50' } : undefined}
      >
        {item.label}
      </MenuItem>
      {!listMaxH && index < items.length - 1 && <MenuDivider m="0" />}
    </React.Fragment>
  ));

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={showIcon ? icon || <Icon as={MdExpandMore} /> : undefined}
        borderRadius={borderRadius}
        {...buttonProps}
      >
        {label}
      </MenuButton>
      <MenuList borderRadius={borderRadius} overflow="hidden" p="0">
        {listMaxH ? (
          <Scrollbars
            autoHeight
            autoHeightMax={listMaxH}
            renderTrackVertical={({ style, ...props }) => (
              <div
                {...props}
                style={{ ...style, width: 4, right: 2, top: 2, bottom: 2, borderRadius: 3, background: 'rgba(0,0,0,0.06)' }}
              />
            )}
            renderThumbVertical={({ style, ...props }) => (
              <div
                {...props}
                style={{ ...style, borderRadius: 3, background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}
              />
            )}
            renderView={({ style, ...props }) => (
              <div {...props} style={{ ...style, marginBottom: 0 }} />
            )}
          >
            {menuItems}
          </Scrollbars>
        ) : (
          menuItems
        )}
      </MenuList>
    </Menu>
  );
};

export default Dropdown;

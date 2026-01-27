import React from 'react';
import styled from 'styled-components';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  direction: 'horizontal' | 'vertical';
}

const Handle = styled.div<{ $direction: 'horizontal' | 'vertical' }>`
  background-color: #3e3e42;
  position: relative;
  z-index: 10;
  transition: background-color 0.2s;

  ${props => props.$direction === 'horizontal' ? `
    width: 5px;
    height: 100%;
    cursor: col-resize;
  ` : `
    width: 100%;
    height: 5px;
    cursor: row-resize;
  `}

  &:hover {
    background-color: #0078d4;
  }
`;

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ onMouseDown, direction }) => {
  return (
    <Handle
        onMouseDown={onMouseDown}
        $direction={direction}
        data-testid={`resize-handle-${direction}`}
    />
  );
};

import { styled } from '@linaria/react';
import { isUndefined } from '@sniptt/guards';

type TextDisplayProps = {
  text: string;
  displayedMaxRows?: number;
};

const StyledContainer = styled.div<{ fixHeight: boolean }>`
  align-items: center;
  display: flex;
  height: ${({ fixHeight }) => (fixHeight ? '20px' : 'auto')};
`;

export const TextDisplay = ({ text, displayedMaxRows }: TextDisplayProps) => {
  return (
    <StyledContainer fixHeight={isUndefined(displayedMaxRows) || displayedMaxRows === 1}>
      <span
        title={text}
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: displayedMaxRows === 1 ? 'nowrap' : 'normal',
          display: displayedMaxRows === 1 ? 'block' : 'inline',
        }}
      >
        {text}
      </span>
    </StyledContainer>
  );
};

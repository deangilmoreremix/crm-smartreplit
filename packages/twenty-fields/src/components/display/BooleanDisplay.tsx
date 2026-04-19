import { styled } from '@linaria/react';

const StyledBooleanFieldValue = styled.div`
  margin-left: 4px;
`;

type BooleanDisplayProps = {
  value: boolean | null | undefined;
};

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  height: 20px;
`;

export const BooleanDisplay = ({ value }: BooleanDisplayProps) => {
  if (value === null || value === undefined) {
    return <StyledContainer />;
  }

  const isTrue = value === true;

  return (
    <StyledContainer>
      {/* Icons would be imported from twenty-ui */}
      {isTrue ? <span>✓</span> : <span>✗</span>}
      <StyledBooleanFieldValue>{isTrue ? 'True' : 'False'}</StyledBooleanFieldValue>
    </StyledContainer>
  );
};

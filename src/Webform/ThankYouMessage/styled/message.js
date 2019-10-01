import styled from 'styled-components';

export default styled.h2`
  border-radius: ${p => p.theme.borderRadius};
  padding: calc(${p => p.theme.spacingUnit} / 2) calc(${p => p.theme.spacingUnit} / 1);
`;

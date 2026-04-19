import { styled } from '@linaria/react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

export const StyledTextInput = styled.input`
  background-color: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  margin: 0;
  outline: none;
  padding: 0 8px;

  &::placeholder,
  &::-webkit-input-placeholder {
    color: #888;
    font-family: inherit;
    font-weight: 500;
  }

  width: 100%;

  &:disabled {
    color: #ccc;
  }
`;

export type TextInputProps = {
  instanceId: string;
  placeholder?: string;
  autoFocus?: boolean;
  value: string;
  onEnter?: (newText: string) => void;
  onEscape?: (newText: string) => void;
  onTab?: (newText: string) => void;
  onShiftTab?: (newText: string) => void;
  onClickOutside?: (event: MouseEvent | TouchEvent, inputValue: string) => void;
  onChange?: (newText: string) => void;
  copyButton?: boolean;
  shouldTrim?: boolean;
  disabled?: boolean;
  className?: string;
};

const getValue = (value: string, shouldTrim: boolean) => {
  if (shouldTrim) {
    return value.trim();
  }

  return value;
};

export const TextInput = ({
  instanceId,
  placeholder,
  autoFocus,
  value,
  onEnter,
  onEscape,
  onTab,
  onShiftTab,
  onClickOutside,
  onChange,
  copyButton = true,
  shouldTrim = true,
  disabled,
  className,
}: TextInputProps) => {
  const [internalText, setInternalText] = useState(value);

  const wrapperRef = useRef<HTMLInputElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInternalText(getValue(event.target.value, shouldTrim));
    onChange?.(getValue(event.target.value, shouldTrim));
  };

  useEffect(() => {
    setInternalText(getValue(value, shouldTrim));
  }, [value, shouldTrim]);

  // Simplified event registration - in real implementation, this would use a hook
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        onEnter?.(internalText);
      } else if (event.key === 'Escape') {
        onEscape?.(internalText);
      } else if (event.key === 'Tab') {
        if (event.shiftKey) {
          onShiftTab?.(internalText);
        } else {
          onTab?.(internalText);
        }
      }
    };

    const input = wrapperRef.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
      return () => input.removeEventListener('keydown', handleKeyDown);
    }
  }, [internalText, onEnter, onEscape, onTab, onShiftTab]);

  return (
    <>
      <StyledTextInput
        id={instanceId}
        autoComplete="off"
        ref={wrapperRef}
        placeholder={placeholder}
        onChange={handleChange}
        autoFocus={autoFocus}
        value={internalText}
        disabled={disabled}
        className={className}
      />
      {copyButton && <div ref={copyRef}>{/* Copy button would be implemented here */}</div>}
    </>
  );
};

import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Custom-styled listbox combobox (not a native <select>) — a trigger button
 * showing the selected option, opening an animated floating panel of options.
 * Fully keyboard operable and ARIA-annotated; mirrors the field/label
 * conventions of TextField.
 */
export function Select({ label, options, value, onChange, disabled = false, id, className }: SelectProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value),
    ),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex] ?? options[0];

  // Close on outside click / Escape while open — same pattern as ConfirmDialog's Escape handling.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const openListbox = () => {
    if (disabled) return;
    setHighlightIndex(selectedIndex === -1 ? 0 : selectedIndex);
    setOpen(true);
  };

  useEffect(() => {
    if (open) {
      optionRefs.current[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightIndex]);

  const commitSelection = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openListbox();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commitSelection(highlightIndex);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'Home':
        event.preventDefault();
        setHighlightIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setHighlightIndex(options.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn('field', className)} ref={rootRef}>
      {label && (
        <label className="field__label" htmlFor={triggerId}>
          {label}
        </label>
      )}
      <div className="select">
        <button
          type="button"
          id={triggerId}
          className={cn('select__trigger', open && 'select__trigger--open')}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open ? `${listboxId}-option-${highlightIndex}` : undefined}
          onClick={() => (open ? setOpen(false) : openListbox())}
          onKeyDown={handleTriggerKeyDown}
        >
          {selectedOption?.icon && (
            <span className="select__icon">
              <Icon name={selectedOption.icon} size={19} color="var(--accent)" />
            </span>
          )}
          <span className="select__value">{selectedOption?.label ?? ''}</span>
          <Icon
            name="expand_more"
            size={20}
            className={cn('select__chevron', open && 'select__chevron--open')}
            color="var(--ink-3)"
          />
        </button>

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            className="select__panel u-fadein"
            aria-labelledby={label ? triggerId : undefined}
            tabIndex={-1}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightIndex;
              return (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  className={cn(
                    'select__option',
                    isHighlighted && 'select__option--highlighted',
                    isSelected && 'select__option--selected',
                  )}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => commitSelection(index)}
                >
                  {option.icon && (
                    <span className="select__icon">
                      <Icon name={option.icon} size={19} color="var(--accent)" />
                    </span>
                  )}
                  <span className="select__optionLabel">{option.label}</span>
                  {isSelected && <Icon name="check" size={18} color="var(--accent)" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

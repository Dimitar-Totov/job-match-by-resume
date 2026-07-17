import { useId, useState } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import './primitives.css';

interface FieldWrapProps {
  label?: string;
  className?: string;
}

type TextFieldProps = FieldWrapProps & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, className, id, type, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && showPassword ? 'text' : type;

  const input = (
    <input
      id={inputId}
      className={cn('field__input', isPassword && 'field__input--withToggle')}
      type={resolvedType}
      {...rest}
    />
  );

  return (
    <div className={cn('field', className)}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      {isPassword ? (
        <div className="field__inputWrap">
          {input}
          <button
            type="button"
            className="field__toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            <Icon name={showPassword ? 'visibility' : 'visibility_off'} size={19} />
          </button>
        </div>
      ) : (
        input
      )}
    </div>
  );
}

type TextAreaFieldProps = FieldWrapProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ label, className, id, ...rest }: TextAreaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={cn('field', className)}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <textarea id={inputId} className="field__input field__textarea" {...rest} />
    </div>
  );
}

import { useId } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../utils/cn';
import './primitives.css';

interface FieldWrapProps {
  label?: string;
  className?: string;
}

type TextFieldProps = FieldWrapProps & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, className, id, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={cn('field', className)}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className="field__input" {...rest} />
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

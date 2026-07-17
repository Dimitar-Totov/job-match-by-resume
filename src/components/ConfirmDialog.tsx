import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import './ConfirmDialog.css';

export type ConfirmDialogTone = 'default' | 'destructive';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered confirm/cancel dialog over a dimmed backdrop. Reusable for any "are you sure" prompt. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  confirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;

    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancelRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="confirmDialog__backdrop" onClick={onCancel}>
      <div
        ref={panelRef}
        className="confirmDialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="confirmDialog__title">
          {title}
        </h2>
        {description && <p className="confirmDialog__description">{description}</p>}
        <div className="confirmDialog__actions">
          <Button variant="ghost" onClick={onCancel} disabled={confirmLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            className={cn(tone === 'destructive' && 'confirmDialog__confirmBtn--destructive')}
            onClick={onConfirm}
            disabled={confirmLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

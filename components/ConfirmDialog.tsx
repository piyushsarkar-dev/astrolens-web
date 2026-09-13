'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/format';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div className="glass-panel rounded-2xl p-6 w-full max-w-sm mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        {danger && (
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
        )}
        <h3 className="text-base font-semibold mb-2">{title}</h3>
        <p className="text-sm text-ink-200 mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={busy} className="btn-ghost">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={cn(danger ? 'btn-danger' : 'btn-primary')}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

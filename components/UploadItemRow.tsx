'use client';

import { CheckCircle2, AlertCircle, X, RotateCw } from 'lucide-react';
import { cn } from '@/lib/format';
import type { UploadItem } from '@/lib/types';

export function UploadItemRow({
  item,
  onRetry,
  onCancel,
}: {
  item: UploadItem;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const status = item.status;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-ink-800/40 border border-ink-700/40">
      <div className="w-10 h-10 rounded-lg bg-ink-700/60 flex items-center justify-center shrink-0 overflow-hidden">
        {status === 'done' && item.result ? (
          <img src={item.result.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <img
            src={URL.createObjectURL(item.file)}
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          {status === 'uploading' && (
            <>
              <div className="flex-1 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-lime rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="text-xs text-ink-300 tabular-nums">{item.progress}%</span>
            </>
          )}
          {status === 'pending' && (
            <span className="text-xs text-ink-300">Waiting…</span>
          )}
          {status === 'done' && (
            <span className="text-xs text-lime flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
            </span>
          )}
          {status === 'error' && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {item.error || 'Failed'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {status === 'error' && (
          <button onClick={onRetry} className="p-1.5 rounded-md hover:bg-ink-700 text-ink-300 hover:text-lime transition-colors" title="Retry">
            <RotateCw className="w-4 h-4" />
          </button>
        )}
        {status !== 'uploading' && (
          <button onClick={onCancel} className="p-1.5 rounded-md hover:bg-ink-700 text-ink-300 hover:text-ink-100 transition-colors" title="Remove">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

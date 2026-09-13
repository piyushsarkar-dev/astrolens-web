'use client';

import { useState, useCallback, useRef } from 'react';
import { X, UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { makeUploadItem, validateFile, uploadToServer } from '@/lib/upload';
import { useGallery } from '@/lib/gallery-context';
import { useAuth } from '@/lib/auth-context';
import { UploadItemRow } from './UploadItemRow';
import type { UploadItem } from '@/lib/types';
import { cn } from '@/lib/format';

export function UploadPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPhoto } = useGallery();
  const { user } = useAuth();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processQueue = useCallback(async (queue: UploadItem[]) => {
    for (const item of queue) {
      if (item.status === 'done' || item.status === 'error') continue;
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const photo = await uploadToServer(item.file, (pct) => {
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: pct } : i));
        });
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done', progress: 100, result: photo } : i));
        addPhoto(photo);
      } catch (err) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: (err as Error).message } : i));
      }
    }
  }, [addPhoto]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newItems: UploadItem[] = [];
    for (const file of arr) {
      const err = validateFile(file);
      const item = makeUploadItem(file);
      if (err) {
        item.status = 'error';
        item.error = err;
      }
      newItems.push(item);
    }
    setItems(prev => [...prev, ...newItems]);
    const processable = newItems.filter(i => i.status === 'pending');
    if (processable.length) processQueue(processable);
  }, [processQueue]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const retry = useCallback((id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'pending', progress: 0, error: undefined } : i));
    const item = items.find(i => i.id === id);
    if (item) processQueue([{ ...item, status: 'pending' as const }]);
  }, [items, processQueue]);

  const cancel = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setItems(prev => prev.filter(i => i.status !== 'done'));
  }, []);

  if (!open) return null;

  const doneCount = items.filter(i => i.status === 'done').length;
  const totalCount = items.length;
  const activeCount = items.filter(i => i.status === 'uploading' || i.status === 'pending').length;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md glass-panel border-l border-ink-700/50 flex flex-col animate-slide-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700/50">
          <div>
            <h3 className="text-base font-semibold">Upload Photos</h3>
            <p className="text-xs text-ink-300 mt-0.5">
              {totalCount > 0 ? `${doneCount} of ${totalCount} done` : 'Select images to upload'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-ink-700/60 text-ink-200 hover:text-ink-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              dragOver
                ? 'border-lime/50 bg-lime/5 scale-[1.01]'
                : 'border-ink-500/50 hover:border-ink-400 hover:bg-ink-800/30'
            )}
          >
            <UploadCloud className={cn('w-10 h-10 mx-auto mb-3', dragOver ? 'text-lime' : 'text-ink-300')} />
            <p className="text-sm font-medium text-ink-100">Drop images here or click to browse</p>
            <p className="text-xs text-ink-300 mt-1">JPEG, PNG, WebP, GIF — up to 32 MB</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
            />
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map(item => (
                <UploadItemRow
                  key={item.id}
                  item={item}
                  onRetry={() => retry(item.id)}
                  onCancel={() => cancel(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-ink-700/50 flex items-center justify-between">
            <button onClick={clearDone} className="text-xs text-ink-300 hover:text-ink-100 transition-colors">
              Clear completed
            </button>
            {activeCount > 0 && (
              <span className="text-xs text-ink-300 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {activeCount} uploading…
              </span>
            )}
            {activeCount === 0 && doneCount > 0 && (
              <span className="text-xs text-lime flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All done
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

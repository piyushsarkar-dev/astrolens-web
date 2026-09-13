'use client';

import { supabase } from './supabase-client';
import type { UploadItem, Photo } from './types';

const MAX_SIZE = 32 * 1024 * 1024; // 32 MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/avif'];

export function validateFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return 'Unsupported file type';
  if (file.size > MAX_SIZE) return 'File exceeds 32 MB';
  return null;
}

export async function uploadToServer(
  file: File,
  onProgress: (pct: number) => void
): Promise<Photo> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.photo) {
            resolve(res.photo as Photo);
          } else {
            reject(new Error(res.error || 'Upload failed'));
          }
        } catch {
          reject(new Error('Invalid server response'));
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

export function makeUploadItem(file: File): UploadItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    status: 'pending',
    progress: 0,
  };
}

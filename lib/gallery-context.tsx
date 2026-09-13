'use client';

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import type { Photo, Album, SortOption, FilterOption } from './types';
import { supabase } from './supabase-client';

const PAGE_SIZE = 60;

type GalleryState = {
  photos: Photo[];
  albums: Album[];
  loading: boolean;
  hasMore: boolean;
  sort: SortOption;
  filter: FilterOption;
  search: string;
  setSort: (s: SortOption) => void;
  setFilter: (f: FilterOption) => void;
  setSearch: (s: string) => void;
  loadPhotos: (reset?: boolean) => Promise<void>;
  loadAlbums: () => Promise<void>;
  addPhoto: (p: Photo) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  removePhoto: (id: string) => void;
  toggleFavorite: (id: string, current: boolean) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restorePhoto: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<{ error: string | null }>;
  createAlbum: (name: string, description?: string) => Promise<{ error: string | null; album?: Album }>;
  renameAlbum: (id: string, name: string) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  setAlbumCover: (albumId: string, photoId: string) => Promise<void>;
  addPhotosToAlbum: (albumId: string, photoIds: string[]) => Promise<void>;
  removePhotoFromAlbum: (albumId: string, photoId: string) => Promise<void>;
  getAlbumPhotos: (albumId: string) => Promise<Photo[]>;
};

const GalleryContext = createContext<GalleryState | undefined>(undefined);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState<SortOption>('newest');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const buildQuery = useCallback((resetPage: number) => {
    let query = supabase.from('photos').select('*');
    if (filter === 'trash') {
      query = query.eq('is_deleted', true);
    } else if (filter === 'favorites') {
      query = query.eq('is_favorite', true).eq('is_deleted', false);
    } else if (filter === 'recent') {
      query = query.eq('is_deleted', false);
    } else {
      query = query.eq('is_deleted', false);
    }
    if (search.trim()) {
      const s = search.trim();
      query = query.or(`filename.ilike.%${s}%,title.ilike.%${s}%,description.ilike.%${s}%`);
    }
    const sortMap: Record<SortOption, { col: string; asc: boolean }> = {
      newest: { col: 'created_at', asc: false },
      oldest: { col: 'created_at', asc: true },
      'name-az': { col: 'filename', asc: true },
      'name-za': { col: 'filename', asc: false },
    };
    const { col, asc } = sortMap[sort];
    query = query.order(col, { ascending: asc });
    query = query.range(resetPage * PAGE_SIZE, (resetPage + 1) * PAGE_SIZE - 1);
    return query;
  }, [filter, sort, search]);

  const loadPhotos = useCallback(async (reset = false) => {
    const targetPage = reset ? 0 : page;
    setLoading(true);
    const { data, error } = await buildQuery(targetPage);
    if (error) {
      console.error('loadPhotos', error);
      setLoading(false);
      return;
    }
    const newPhotos = (data ?? []) as Photo[];
    setHasMore(newPhotos.length === PAGE_SIZE);
    if (reset || targetPage === 0) {
      setPhotos(newPhotos);
      setPage(1);
    } else {
      setPhotos(prev => [...prev, ...newPhotos]);
      setPage(targetPage + 1);
    }
    setLoading(false);
  }, [buildQuery, page]);

  const loadAlbums = useCallback(async () => {
    const { data, error } = await supabase
      .from('albums')
      .select('*, cover_photo:photos(*)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('loadAlbums', error);
      return;
    }
    const albumList = (data ?? []) as Album[];
    const withCounts = await Promise.all(
      albumList.map(async (album) => {
        const { count } = await supabase
          .from('album_photos')
          .select('*', { count: 'exact', head: true })
          .eq('album_id', album.id);
        return { ...album, photo_count: count ?? 0 };
      })
    );
    setAlbums(withCounts);
  }, []);

  const addPhoto = useCallback((p: Photo) => {
    setPhotos(prev => [p, ...prev]);
  }, []);

  const updatePhoto = useCallback((id: string, updates: Partial<Photo>) => {
    setPhotos(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  const toggleFavorite = useCallback(async (id: string, current: boolean) => {
    updatePhoto(id, { is_favorite: !current });
    const { error } = await supabase
      .from('photos')
      .update({ is_favorite: !current })
      .eq('id', id);
    if (error) {
      updatePhoto(id, { is_favorite: current });
    }
  }, [updatePhoto]);

  const moveToTrash = useCallback(async (id: string) => {
    updatePhoto(id, { is_deleted: true });
    const { error } = await supabase
      .from('photos')
      .update({ is_deleted: true })
      .eq('id', id);
    if (error) updatePhoto(id, { is_deleted: false });
  }, [updatePhoto]);

  const restorePhoto = useCallback(async (id: string) => {
    updatePhoto(id, { is_deleted: false });
    const { error } = await supabase
      .from('photos')
      .update({ is_deleted: false })
      .eq('id', id);
    if (error) updatePhoto(id, { is_deleted: true });
  }, [updatePhoto]);

  const permanentDelete = useCallback(async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (photo?.delete_url) {
      try {
        await fetch(photo.delete_url, { method: 'DELETE' }).catch(() => {});
      } catch {
        // best-effort remote delete; continue to remove DB record
      }
    }
    const { error } = await supabase.from('photos').delete().eq('id', id);
    if (error) return { error: error.message };
    removePhoto(id);
    return { error: null };
  }, [photos, removePhoto]);

  const createAlbum = useCallback(async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('albums')
      .insert({ name, description: description ?? '' })
      .select('*')
      .maybeSingle();
    if (error) return { error: error.message };
    const album = data as Album;
    setAlbums(prev => [{ ...album, photo_count: 0 }, ...prev]);
    return { error: null, album };
  }, []);

  const renameAlbum = useCallback(async (id: string, name: string) => {
    setAlbums(prev => prev.map(a => (a.id === id ? { ...a, name } : a)));
    await supabase.from('albums').update({ name }).eq('id', id);
  }, []);

  const deleteAlbum = useCallback(async (id: string) => {
    setAlbums(prev => prev.filter(a => a.id !== id));
    await supabase.from('albums').delete().eq('id', id);
  }, []);

  const setAlbumCover = useCallback(async (albumId: string, photoId: string) => {
    setAlbums(prev => prev.map(a => (a.id === albumId ? { ...a, cover_photo_id: photoId } : a)));
    await supabase.from('albums').update({ cover_photo_id: photoId }).eq('id', albumId);
  }, []);

  const addPhotosToAlbum = useCallback(async (albumId: string, photoIds: string[]) => {
    const rows = photoIds.map(pid => ({ album_id: albumId, photo_id: pid }));
    await supabase.from('album_photos').insert(rows);
    setAlbums(prev => prev.map(a =>
      a.id === albumId ? { ...a, photo_count: (a.photo_count ?? 0) + photoIds.length } : a
    ));
  }, []);

  const removePhotoFromAlbum = useCallback(async (albumId: string, photoId: string) => {
    await supabase
      .from('album_photos')
      .delete()
      .eq('album_id', albumId)
      .eq('photo_id', photoId);
    setAlbums(prev => prev.map(a =>
      a.id === albumId ? { ...a, photo_count: Math.max((a.photo_count ?? 1) - 1, 0) } : a
    ));
  }, []);

  const getAlbumPhotos = useCallback(async (albumId: string) => {
    const { data, error } = await supabase
      .from('album_photos')
      .select('photo:photos(*)')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return ((data ?? []) as unknown as { photo: Photo }[]).map(row => row.photo);
  }, []);

  return (
    <GalleryContext.Provider
      value={{
        photos, albums, loading, hasMore, sort, filter, search,
        setSort, setFilter, setSearch,
        loadPhotos, loadAlbums, addPhoto, updatePhoto, removePhoto,
        toggleFavorite, moveToTrash, restorePhoto, permanentDelete,
        createAlbum, renameAlbum, deleteAlbum, setAlbumCover,
        addPhotosToAlbum, removePhotoFromAlbum, getAlbumPhotos,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGallery must be used within GalleryProvider');
  return ctx;
}

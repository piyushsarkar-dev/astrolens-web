export type Photo = {
  id: string;
  user_id: string;
  imgbb_id: string;
  filename: string;
  image_url: string;
  display_url: string;
  thumbnail_url: string;
  delete_url: string | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  file_size: number | null;
  title: string;
  description: string;
  is_favorite: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type Album = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  cover_photo_id: string | null;
  created_at: string;
  updated_at: string;
  photo_count?: number;
  cover_photo?: Photo | null;
};

export type AlbumPhoto = {
  id: string;
  album_id: string;
  photo_id: string;
  created_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UploadItem = {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
  result?: Photo;
};

export type SortOption = 'newest' | 'oldest' | 'name-az' | 'name-za';
export type FilterOption = 'all' | 'favorites' | 'recent' | 'trash';

export type GalleryPage =
  | 'home'
  | 'photos'
  | 'albums'
  | 'favorites'
  | 'trash'
  | 'settings';

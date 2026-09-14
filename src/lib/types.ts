export type ImageRecord = {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  size: number;
  mime: string;
  deleteToken: string | null;
  uploadedAt: number;
  expiresAt: number | null;
  source: string;
  managed: boolean;
  /** Supabase auth user id that owns this photo. `null` = legacy photo from before accounts. */
  ownerId?: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  imgbb_api_key: string | null;
  created_at: string;
  updated_at: string;
};

export type ImageListResponse = {
  data?: ImageRecord[];
  error?: string;
  errors?: string[];
};

export type ImageResponse = {
  data?: ImageRecord;
  error?: string;
};

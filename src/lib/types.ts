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
};

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
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

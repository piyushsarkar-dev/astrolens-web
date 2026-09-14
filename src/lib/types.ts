export type ImageExifMetadata = {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: number;
  focalLength?: string;
  colorSpace?: string;
  flash?: string;
  meteringMode?: string;
};

export type ImageLocation = {
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
};

export type DetectedFace = {
  id?: string;
  name: string;
  confidence?: number;
  ageRange?: string;
  expression?: string;
};

export type ImageEdits = {
  rotation?: number; // 0, 90, 180, 270
  flipH?: boolean;
  flipV?: boolean;
  brightness?: number; // percentage, default 100
  contrast?: number; // percentage, default 100
  saturation?: number; // percentage, default 100
  filter?: "none" | "grayscale" | "sepia" | "vivid" | "cool" | "warm";
};

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
  /** Favorite flag */
  isFavorite?: boolean;
  /** Associated album names */
  albums?: string[];
  /** Search and classification tags */
  tags?: string[];
  /** Technical EXIF / camera metadata */
  metadata?: ImageExifMetadata;
  /** GPS / location information */
  location?: ImageLocation;
  /** OCR extracted text */
  ocrResult?: string;
  /** Detected faces / persons */
  detectedFaces?: DetectedFace[];
  /** Saved visual edits */
  edits?: ImageEdits;
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

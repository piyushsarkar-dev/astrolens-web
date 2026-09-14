import type {
  DetectedFace,
  ImageExifMetadata,
  ImageLocation,
  ImageRecord,
} from "./types";

/**
 * Returns genuine metadata for an ImageRecord.
 * Strictly avoids fake mock cameras, fake locations, or fabricated OCR/faces.
 * Only returns actual data stored in the record.
 */
export function getResolvedMetadata(image: ImageRecord): {
  exif: ImageExifMetadata | null;
  location: ImageLocation | null;
  ocrText: string | null;
  faces: DetectedFace[];
  tags: string[];
  albums: string[];
} {
  return {
    exif: image.metadata || null,
    location: image.location || null,
    ocrText: image.ocrResult || null,
    faces:
      image.detectedFaces && image.detectedFaces.length > 0
        ? image.detectedFaces
        : [],
    tags: image.tags || [],
    albums: image.albums || [],
  };
}

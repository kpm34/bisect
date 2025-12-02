import { createClient } from '@/lib/supabase/client';
import { createAsset } from './assets';
import type { Asset } from './types';

const BUCKET_NAME = 'user-assets';

export type AssetCategory = 'svg' | 'texture' | 'material' | 'image' | 'model' | 'video';

interface UploadAssetOptions {
  name: string;
  category: AssetCategory;
  file: File | Blob;
  /** Optional thumbnail blob */
  thumbnail?: Blob;
  /** Additional metadata */
  data?: Record<string, unknown>;
  /** Tags for organization */
  tags?: string[];
}

interface UploadResult {
  success: boolean;
  asset?: Asset;
  error?: string;
}

/**
 * Upload a file to storage and create an asset record
 */
export async function uploadAsset(options: UploadAssetOptions): Promise<UploadResult> {
  const supabase = createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be signed in to save assets' };
  }

  const userId = user.id;
  const timestamp = Date.now();
  const fileExt = getFileExtension(options.file, options.category);
  const fileName = `${sanitizeFileName(options.name)}-${timestamp}.${fileExt}`;
  const storagePath = `${userId}/${options.category}/${fileName}`;

  try {
    // Upload main file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, options.file, {
        contentType: getContentType(options.category, fileExt),
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Upload thumbnail if provided
    let thumbnailPath: string | null = null;
    if (options.thumbnail) {
      const thumbName = `${sanitizeFileName(options.name)}-${timestamp}-thumb.png`;
      const thumbPath = `${userId}/${options.category}/thumbnails/${thumbName}`;

      const { error: thumbError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(thumbPath, options.thumbnail, {
          contentType: 'image/png',
          upsert: false
        });

      if (!thumbError) {
        thumbnailPath = thumbPath;
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    // Create asset record in database
    const asset = await createAsset({
      user_id: userId,
      name: options.name,
      type: options.category,
      source: 'upload',
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      data: {
        ...options.data,
        publicUrl: urlData.publicUrl,
        originalName: options.name,
        fileSize: options.file.size,
      },
      tags: options.tags || [],
    });

    if (!asset) {
      // Cleanup uploaded file if asset creation failed
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      if (thumbnailPath) {
        await supabase.storage.from(BUCKET_NAME).remove([thumbnailPath]);
      }
      return { success: false, error: 'Failed to create asset record' };
    }

    return { success: true, asset };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Convert SVG string to a Blob for upload
 */
export function svgToBlob(svgString: string): Blob {
  return new Blob([svgString], { type: 'image/svg+xml' });
}

/**
 * Convert base64 data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * Generate thumbnail from canvas or image element
 */
export async function generateThumbnail(
  source: HTMLCanvasElement | HTMLImageElement | string,
  size: number = 256
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(null);
      return;
    }

    if (typeof source === 'string') {
      // SVG string - render to image first
      const img = new Image();
      const svgBlob = new Blob([source], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } else if (source instanceof HTMLCanvasElement) {
      const scale = Math.min(size / source.width, size / source.height);
      const w = source.width * scale;
      const h = source.height * scale;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(source, (size - w) / 2, (size - h) / 2, w, h);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    } else {
      // HTMLImageElement
      const scale = Math.min(size / source.width, size / source.height);
      const w = source.width * scale;
      const h = source.height * scale;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(source, (size - w) / 2, (size - h) / 2, w, h);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    }
  });
}

// Helper functions
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function getFileExtension(file: File | Blob, category: AssetCategory): string {
  if (file instanceof File && file.name) {
    const ext = file.name.split('.').pop();
    if (ext) return ext;
  }

  // Fallback based on category
  switch (category) {
    case 'svg': return 'svg';
    case 'texture': return 'png';
    case 'material': return 'png';
    case 'image': return 'png';
    case 'model': return 'glb';
    case 'video': return 'mp4';
    default: return 'bin';
  }
}

function getContentType(category: AssetCategory, ext: string): string {
  const mimeTypes: Record<string, string> = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    glb: 'model/gltf-binary',
    gltf: 'model/gltf+json',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

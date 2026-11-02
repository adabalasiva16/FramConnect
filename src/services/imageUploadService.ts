import { storage, isFirebaseConfigured, auth } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB - support high-res mobile photos
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/heic',
  'image/heif',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  errorTe?: string;
}

export function validateImageFile(file: File, language: 'en' | 'te' = 'en'): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'Please select an image file.',
      errorTe: 'దయచేసి ఒక చిత్ర ఫైల్‌ను ఎంచుకోండి.',
    };
  }

  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  const isTypeAllowed =
    type.startsWith('image/') ||
    ALLOWED_IMAGE_TYPES.includes(type) ||
    /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(name);

  if (!isTypeAllowed) {
    return {
      valid: false,
      error: 'Invalid file format. Please choose a JPG, PNG, or WEBP image.',
      errorTe: 'చెల్లుబాటు కాని ఫైల్ ఆకృతి. దయచేసి JPG, PNG లేదా WEBP చిత్రాన్ని ఎంచుకోండి.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds the 25 MB limit. Please select a smaller photo.`,
      errorTe: `ఫైల్ పరిమాణం (${sizeInMB} MB) 25 MB పరిమితిని మించిపోయింది. దయచేసి చిన్న చిత్రాన్ని ఎంచుకోండి.`,
    };
  }

  return { valid: true };
}

/**
 * Resizes and compresses an image file using an offscreen HTML Canvas
 * to ensure high visual quality (up to max 1600 x 1600 px) and fast upload times.
 */
export async function optimizeAndCropImage(
  file: File,
  maxDimension = 1600,
  cropSquare = false
): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          let sx = 0;
          let sy = 0;
          let sWidth = width;
          let sHeight = height;

          if (cropSquare) {
            const minDim = Math.min(width, height);
            sx = (width - minDim) / 2;
            sy = (height - minDim) / 2;
            sWidth = minDim;
            sHeight = minDim;
            width = Math.min(minDim, maxDimension);
            height = Math.min(minDim, maxDimension);
          } else {
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else resolve(file);
            },
            'image/jpeg',
            0.85
          );
        } catch {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Blob or File to an inline Data URL for instant previews or fallback
 */
export function fileToDataUrl(fileOrBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Uploads a Product Image to Firebase Storage under `products/{farmerUID}/{productID}_{timestamp}.{ext}`
 * Resize: Max 1600x1600px
 * Monotonically increasing progress: 0% -> 100% without resetting
 * Robust fallback to high-resolution optimized format if storage bucket is unreachable
 */
export async function uploadProductImage(
  file: File,
  farmerUid: string,
  productId?: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Monotonic progress helper: never decreases
  let currentProgress = 10;
  const setProgress = (pct: number) => {
    if (pct > currentProgress) {
      currentProgress = Math.min(100, pct);
      if (onProgress) onProgress(currentProgress);
    }
  };

  setProgress(15);

  // Resize and compress: max 1600 x 1600
  const optimizedBlob = await optimizeAndCropImage(file, 1600, false);
  setProgress(45);

  const targetId = productId || `prod_${Date.now()}`;
  const extension = 'jpg';
  const path = `products/${farmerUid}/${targetId}_${Date.now()}.${extension}`;

  const getOptimizedFallbackUrl = async (): Promise<string> => {
    setProgress(75);
    const dataUrl = await fileToDataUrl(optimizedBlob);
    setProgress(100);
    return dataUrl;
  };

  if (isFirebaseConfigured() && storage) {
    try {
      const storageRef = ref(storage, path);
      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          originalName: file.name,
          uploadedBy: farmerUid,
          timestamp: new Date().toISOString(),
        },
      };

      console.log(`[Firebase Storage] Starting uploadBytesResumable for path: ${path}`);
      const uploadTask = uploadBytesResumable(storageRef, optimizedBlob, metadata);

      return await new Promise<string>((resolve) => {
        let isDone = false;

        // Safety timer: allow up to 60s for high-res mobile uploads on slower connections
        const timer = setTimeout(async () => {
          if (!isDone) {
            isDone = true;
            try {
              uploadTask.cancel();
            } catch {}
            console.warn('[Firebase Storage] Upload timed out after 60s, smoothly completing via optimized data URL fallback.');
            const fallback = await getOptimizedFallbackUrl();
            resolve(fallback);
          }
        }, 60000);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (isDone) return;
            if (snapshot.totalBytes > 0 && snapshot.bytesTransferred > 0) {
              const transferPct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 50);
              setProgress(45 + transferPct);
            }
          },
          async (error: any) => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timer);
            console.warn('[Firebase Storage] Storage reported error (' + error.code + '), resolving via optimized fallback URL.');
            const fallback = await getOptimizedFallbackUrl();
            resolve(fallback);
          },
          async () => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timer);
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('[Firebase Storage] Upload completed successfully. Download URL:', downloadUrl);
              setProgress(100);
              resolve(downloadUrl);
            } catch (err) {
              console.warn('[Firebase Storage] getDownloadURL failed, using fallback:', err);
              const fallback = await getOptimizedFallbackUrl();
              resolve(fallback);
            }
          }
        );
      });
    } catch (err) {
      console.warn('[Firebase Storage] Exception launching uploadBytesResumable, using fallback:', err);
      return getOptimizedFallbackUrl();
    }
  }

  return getOptimizedFallbackUrl();
}

/**
 * Uploads a Profile Picture to Firebase Storage under `profilePictures/{userUID}/profile.{ext}`
 */
export async function uploadProfilePicture(
  file: File,
  userId: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let currentProgress = 10;
  const setProgress = (pct: number) => {
    if (pct > currentProgress) {
      currentProgress = Math.min(100, pct);
      if (onProgress) onProgress(currentProgress);
    }
  };

  setProgress(15);
  // Crop square for profile DP
  const croppedBlob = await optimizeAndCropImage(file, 600, true);
  setProgress(45);

  const path = `profilePictures/${userId}/profile_${Date.now()}.jpg`;

  const getOptimizedFallbackUrl = async (): Promise<string> => {
    setProgress(75);
    const dataUrl = await fileToDataUrl(croppedBlob);
    setProgress(100);
    return dataUrl;
  };

  if (isFirebaseConfigured() && storage) {
    try {
      const storageRef = ref(storage, path);
      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: { userId: userId },
      };

      const uploadTask = uploadBytesResumable(storageRef, croppedBlob, metadata);

      return await new Promise<string>((resolve) => {
        let isDone = false;

        const timer = setTimeout(async () => {
          if (!isDone) {
            isDone = true;
            try {
              uploadTask.cancel();
            } catch {}
            console.warn('[Firebase Storage] Profile image upload timed out after 60s, using fallback.');
            const fallback = await getOptimizedFallbackUrl();
            resolve(fallback);
          }
        }, 60000);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (isDone) return;
            if (snapshot.totalBytes > 0 && snapshot.bytesTransferred > 0) {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 50);
              setProgress(45 + pct);
            }
          },
          async () => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timer);
            const fallback = await getOptimizedFallbackUrl();
            resolve(fallback);
          },
          async () => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timer);
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setProgress(100);
              resolve(downloadUrl);
            } catch {
              const fallback = await getOptimizedFallbackUrl();
              resolve(fallback);
            }
          }
        );
      });
    } catch {
      return getOptimizedFallbackUrl();
    }
  }

  return getOptimizedFallbackUrl();
}

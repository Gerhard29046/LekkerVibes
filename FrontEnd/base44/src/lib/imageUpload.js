import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebaseClient';

const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // reject absurdly large source files outright
const MAX_DIMENSION = 1600; // longest side, post-compression
const JPEG_QUALITY = 0.82;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

class ImageUploadError extends Error {}

function loadImageBitmap(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageUploadError('Could not read that image file.'));
    img.src = URL.createObjectURL(file);
  });
}

async function compress(file) {
  const img = await loadImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, outputType, outputType === 'image/jpeg' ? JPEG_QUALITY : undefined)
  );
  return blob || file;
}

// Validates, compresses, and uploads an image to Firebase Storage under
// `folder` (e.g. `users/{uid}`, `communities/{communityId}`), matching the
// path prefixes Firebase/storage.rules grants write access for. Returns the
// public download URL.
export async function uploadImage(file, folder) {
  if (!file) throw new ImageUploadError('No file selected.');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError('Please choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageUploadError('That image is too large (max 15MB).');
  }

  const compressed = await compress(file);
  const extension = compressed.type === 'image/png' ? 'png' : 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const storageRef = ref(storage, `${folder}/${filename}`);
  await uploadBytes(storageRef, compressed, { contentType: compressed.type });
  return getDownloadURL(storageRef);
}

import { uploadImage } from '@/lib/imageUpload';

// Firebase Storage-backed replacement for the old Laravel /uploads endpoint.
// Returns a plain download URL string — there's no separate "media" record
// to reference by id in the Firestore data model, so callers store the URL
// directly on the community/event/profile document.
export const uploadsApi = {
  upload: (file, folder) => uploadImage(file, folder),
};

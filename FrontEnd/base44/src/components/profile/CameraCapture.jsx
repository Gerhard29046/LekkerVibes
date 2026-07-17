import React, { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';

// Captures a profile photo live from the device camera rather than
// accepting a file upload — per product decision, this is a "camera-only,
// no anti-spoofing ML" honesty nudge, not real biometric liveness
// detection. A photo taken this way sets `photoVerified: true`, which
// drives the "Photo verified" badge; it is not the same as the account-
// level `isVerified` badge (admin/Worker-only, unrelated).
export default function CameraCapture({ folder, onCaptured, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState(null); // data URL preview
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError('Could not access your camera — check your browser permissions and try again.'));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL('image/jpeg', 0.92));
  };

  const handleRetake = () => setCaptured(null);

  const handleUse = async () => {
    setUploading(true);
    setError('');
    try {
      const blob = await (await fetch(captured)).blob();
      const url = await uploadImage(blob, folder);
      onCaptured(url);
    } catch (err) {
      setError(err.message || 'Upload failed — please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-cream w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-sand bg-white">
          <h3 className="font-body font-semibold text-charcoal flex items-center gap-2">
            <Camera className="w-4 h-4 text-ocean" /> Take a live photo
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-sand rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="aspect-square bg-charcoal relative overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-coral" />
              <p className="text-sm">{error}</p>
            </div>
          ) : captured ? (
            <img src={captured} alt="Captured preview" className="w-full h-full object-cover" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          )}
        </div>

        <div className="p-4 flex gap-2">
          {captured ? (
            <>
              <button onClick={handleRetake} disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sand text-charcoal text-sm font-semibold rounded-xl hover:bg-sand/80 transition-colors disabled:opacity-60">
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
              <button onClick={handleUse} disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Use this photo'}
              </button>
            </>
          ) : (
            <button onClick={handleCapture} disabled={!!error}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-40">
              <Camera className="w-4 h-4" /> Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

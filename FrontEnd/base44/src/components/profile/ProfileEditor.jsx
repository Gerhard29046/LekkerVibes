import React, { useState, useEffect } from 'react';
import { profileApi } from '@/api/profileApi';
import { uploadsApi } from '@/api/uploadsApi';
import { socialLinksApi, PLATFORMS } from '@/api/socialLinksApi';
import { useLocation } from '@/hooks/useLocation.jsx';
import { X, Upload, Loader2, Trash2, Camera, Check } from 'lucide-react';
import CameraCapture from './CameraCapture';
import { PROFILE_THEMES, DEFAULT_PROFILE_THEME } from '@/lib/profileThemes';

const PLATFORM_LABELS = { instagram: 'Instagram', facebook: 'Facebook', strava: 'Strava', website: 'Website' };

export default function ProfileEditor({ profile, interests, currentUser, onSave, onClose }) {
  const { cities } = useLocation();
  const [form, setForm] = useState({
    displayName: profile?.displayName || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    city: profile?.city || '',
    interests: profile?.interests || [],
    work: profile?.work || '',
    education: profile?.education || '',
    languages: (profile?.languages || []).join(', '),
    photoURL: profile?.photoURL || null,
    photoVerified: profile?.photoVerified || false,
    coverURL: profile?.coverURL || null,
    profileTheme: profile?.profileTheme || DEFAULT_PROFILE_THEME,
  });
  const [socialUrls, setSocialUrls] = useState({});
  const [socialLoaded, setSocialLoaded] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(profile?.photoURL || '');
  const [coverPreview, setCoverPreview] = useState(profile?.coverURL || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (socialLoaded) return;
    Promise.all(PLATFORMS.map((p) => socialLinksApi.get(currentUser.uid, p))).then((values) => {
      setSocialUrls(Object.fromEntries(PLATFORMS.map((p, i) => [p, values[i] || ''])));
      setSocialLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleInterest = (name) => {
    set('interests', form.interests.includes(name)
      ? form.interests.filter(x => x !== name)
      : [...form.interests, name]);
  };

  const handleUpload = async (e, field, previewSetter) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(field);
    setUploadError('');
    try {
      const url = await uploadsApi.upload(file, `users/${currentUser.uid}`);
      set(field, url);
      previewSetter(url);
    } catch (err) {
      setUploadError(err.message || 'Upload failed — please try a different image.');
    } finally {
      setUploading(null);
    }
  };

  const handleCameraCaptured = (url) => {
    set('photoURL', url);
    set('photoVerified', true);
    setPhotoPreview(url);
    setCameraOpen(false);
  };

  const handleRemovePhoto = () => {
    set('photoURL', null);
    set('photoVerified', false);
    setPhotoPreview('');
  };

  const handleSave = async () => {
    setSaving(true);
    setUsernameError('');
    try {
      const languages = form.languages.split(',').map((l) => l.trim()).filter(Boolean);
      await profileApi.update(currentUser.uid, { ...form, languages });

      const newUsername = form.username.trim().toLowerCase();
      if (newUsername && newUsername !== (profile?.username || '')) {
        try {
          await profileApi.claimUsername(currentUser.uid, newUsername, profile?.username);
        } catch {
          setUsernameError('That username is already taken.');
          setSaving(false);
          return;
        }
      }

      await Promise.all(PLATFORMS.map((p) => {
        const url = socialUrls[p]?.trim();
        if (!url) return socialLinksApi.remove(currentUser.uid, p).catch(() => {});
        return socialLinksApi.set(currentUser.uid, p, url);
      }));
      await profileApi.update(currentUser.uid, {
        hasInstagram: !!socialUrls.instagram, hasFacebook: !!socialUrls.facebook,
        hasStrava: !!socialUrls.strava, hasWebsite: !!socialUrls.website,
      });

      const updated = await profileApi.get(currentUser.uid);
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand bg-white">
          <h2 className="font-body font-bold text-lg text-charcoal">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-sand rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Photos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">
                Profile Photo {form.photoVerified && <span className="text-teal normal-case font-normal">· Verified live</span>}
              </label>
              <div className="relative h-24 rounded-xl overflow-hidden bg-sand border border-border">
                {photoPreview
                  ? <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean/20 to-teal/20">
                      <Camera className="w-6 h-6 text-charcoal/40" />
                    </div>
                }
              </div>
              <button type="button" onClick={() => setCameraOpen(true)}
                className="mt-1.5 flex items-center gap-1 text-xs text-ocean font-medium">
                <Camera className="w-3 h-3" /> Take a live photo
              </button>
              {photoPreview && (
                <button type="button" onClick={handleRemovePhoto} className="mt-1.5 ml-3 inline-flex items-center gap-1 text-xs text-coral font-medium">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Cover Photo</label>
              <div className="relative h-24 rounded-xl overflow-hidden bg-sand border border-border cursor-pointer">
                {coverPreview
                  ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-ocean/20 to-teal/20">
                      <Upload className="w-6 h-6 text-charcoal/40" />
                    </div>
                }
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handleUpload(e, 'coverURL', setCoverPreview)}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
                {uploading === 'coverURL' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
          {uploadError && <p className="text-xs text-coral -mt-3">{uploadError}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Display Name</label>
              <input
                value={form.displayName}
                onChange={e => set('displayName', e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Username</label>
              <input
                value={form.username}
                onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
              />
              {usernameError && <p className="text-xs text-coral mt-1">{usernameError}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Tell your community a bit about yourself..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">City</label>
            <select value={form.city} onChange={e => set('city', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30">
              <option value="">Select city</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Work</label>
              <input value={form.work} onChange={e => set('work', e.target.value)} placeholder="e.g. Marketing Manager"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Education</label>
              <input value={form.education} onChange={e => set('education', e.target.value)} placeholder="e.g. Stellenbosch University"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Languages (comma-separated)</label>
            <input value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="English, Afrikaans"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30" />
          </div>

          {/* Interests */}
          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {interests.map(i => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggleInterest(i.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.interests.includes(i.name)
                      ? 'bg-ocean text-white border-ocean'
                      : 'bg-white text-charcoal/60 border-border hover:border-ocean/30'
                  }`}
                >
                  {i.name}
                </button>
              ))}
            </div>
          </div>

          {/* Profile accent colour */}
          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-2">
              Profile accent colour
            </label>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(PROFILE_THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('profileTheme', key)}
                  aria-label={theme.label}
                  aria-pressed={form.profileTheme === key}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ backgroundColor: theme.primary }}
                >
                  {form.profileTheme === key && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Social links */}
          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-2">
              Social links — hidden by default, only shared if you approve a request
            </label>
            <div className="space-y-2">
              {PLATFORMS.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <span className="w-20 text-xs font-medium text-charcoal/60 shrink-0">{PLATFORM_LABELS[p]}</span>
                  <input
                    value={socialUrls[p] || ''}
                    onChange={(e) => setSocialUrls((s) => ({ ...s, [p]: e.target.value }))}
                    placeholder={socialLinksApi.domainHint(p)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-ocean/30"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-sand bg-white flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-charcoal hover:bg-sand transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {cameraOpen && (
        <CameraCapture
          folder={`users/${currentUser.uid}`}
          onCaptured={handleCameraCaptured}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}

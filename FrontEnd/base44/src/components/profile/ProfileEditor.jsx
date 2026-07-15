import React, { useState, useEffect } from 'react';
import { profileApi } from '@/api/profileApi';
import { uploadsApi } from '@/api/uploadsApi';
import { locationApi } from '@/api/locationApi';
import { X, Upload, Loader2 } from 'lucide-react';

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];

export default function ProfileEditor({ profile, interests, onSave, onClose }) {
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    location_id: profile?.location?.id || '',
    pronouns: profile?.pronouns || '',
    age_range: profile?.age_range || '',
    interest_ids: (profile?.interests || []).map(i => i.id),
    avatar_media_id: null,
    cover_media_id: null,
    alcohol_free_pref: profile?.alcohol_free_pref || false,
    family_friendly_pref: profile?.family_friendly_pref || false,
  });
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const [coverPreview, setCoverPreview] = useState(profile?.cover_url || '');
  const [locations, setLocations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    locationApi.popular().then(result => setLocations(result.data)).catch(() => setLocations([]));
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleInterest = (id) => {
    set('interest_ids', form.interest_ids.includes(id)
      ? form.interest_ids.filter(x => x !== id)
      : [...form.interest_ids, id]);
  };

  const handleFileUpload = async (e, mediaField, previewSetter) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(mediaField);
    try {
      const media = await uploadsApi.upload(file);
      set(mediaField, media.id);
      previewSetter(media.url);
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { interest_ids, ...profileFields } = form;
      if (!profileFields.avatar_media_id) delete profileFields.avatar_media_id;
      if (!profileFields.cover_media_id) delete profileFields.cover_media_id;
      if (!profileFields.location_id) profileFields.location_id = null;

      await profileApi.update(profileFields);
      await profileApi.syncInterests(interest_ids);
      const updated = await profileApi.get();
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand bg-white">
          <h2 className="font-heading font-bold text-lg text-charcoal">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-sand rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Photos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Profile Photo</label>
              <div className="relative h-24 rounded-xl overflow-hidden bg-sand border border-border cursor-pointer group">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean/20 to-teal/20">
                      <Upload className="w-6 h-6 text-charcoal/40" />
                    </div>
                }
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'avatar_media_id', setAvatarPreview)}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
                {uploading === 'avatar_media_id' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
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
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'cover_media_id', setCoverPreview)}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
                {uploading === 'cover_media_id' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic fields */}
          {[
            { label: 'Display Name', key: 'display_name', placeholder: 'Your name' },
            { label: 'Username', key: 'username', placeholder: 'username' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
              />
            </div>
          ))}

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Location</label>
              <select value={form.location_id} onChange={e => set('location_id', e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30">
                <option value="">Select location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Pronouns</label>
              <select value={form.pronouns} onChange={e => set('pronouns', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30">
                <option value="">Prefer not to say</option>
                {['he/him', 'she/her', 'they/them', 'he/they', 'she/they'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Age range</label>
            <select value={form.age_range} onChange={e => set('age_range', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30">
              <option value="">Prefer not to say</option>
              {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Interests */}
          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {interests.map(i => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggleInterest(i.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.interest_ids.includes(i.id)
                      ? 'bg-ocean text-white border-ocean'
                      : 'bg-white text-charcoal/60 border-border hover:border-ocean/30'
                  }`}
                >
                  {i.name}
                </button>
              ))}
            </div>
          </div>

          {/* Prefs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block">Preferences</label>
            {[
              { key: 'alcohol_free_pref', label: 'Prefer alcohol-free activities' },
              { key: 'family_friendly_pref', label: 'Prefer family-friendly activities' },
            ].map(p => (
              <label key={p.key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form[p.key]} onChange={e => set(p.key, e.target.checked)}
                  className="w-4 h-4 rounded accent-ocean" />
                <span className="text-sm text-charcoal">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-sand bg-white flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-charcoal hover:bg-sand transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
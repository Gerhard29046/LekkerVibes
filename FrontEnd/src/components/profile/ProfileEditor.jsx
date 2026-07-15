import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Loader2 } from 'lucide-react';

const INTERESTS_LIST = [
  'Running', 'Walking', 'Hiking', 'Surfing', 'Cycling', 'Eating', 'Dancing',
  'Reading', 'Gaming', 'Art', 'Volunteering', 'Worship', 'Fitness', 'Exploring', 'Socialising'
];

const CITIES = ['Stellenbosch', 'Somerset West', 'Cape Town', 'Paarl', 'Durbanville', 'Bellville', 'George', 'Johannesburg', 'Pretoria', 'Durban'];

export default function ProfileEditor({ user, profile, onSave, onClose }) {
  const [form, setForm] = useState({
    display_name: profile?.display_name || user?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    city: profile?.city || '',
    neighbourhood: profile?.neighbourhood || '',
    pronouns: profile?.pronouns || '',
    age_range: profile?.age_range || '',
    interests: profile?.interests || [],
    profile_photo: profile?.profile_photo || '',
    cover_photo: profile?.cover_photo || '',
    alcohol_free_pref: profile?.alcohol_free_pref || false,
    family_friendly_pref: profile?.family_friendly_pref || false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleInterest = (i) => {
    set('interests', form.interests.includes(i)
      ? form.interests.filter(x => x !== i)
      : [...form.interests, i]);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set(field, file_url);
    setUploading(null);
  };

  const handleSave = async () => {
    setSaving(true);
    let saved;
    const data = { ...form, user_id: user.id };
    if (profile?.id) {
      saved = await base44.entities.UserProfile.update(profile.id, data);
    } else {
      saved = await base44.entities.UserProfile.create(data);
    }
    setSaving(false);
    onSave(saved);
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
                {form.profile_photo
                  ? <img src={form.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean/20 to-teal/20">
                      <Upload className="w-6 h-6 text-charcoal/40" />
                    </div>
                }
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'profile_photo')}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
                {uploading === 'profile_photo' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">Cover Photo</label>
              <div className="relative h-24 rounded-xl overflow-hidden bg-sand border border-border cursor-pointer">
                {form.cover_photo
                  ? <img src={form.cover_photo} alt="Cover" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-ocean/20 to-teal/20">
                      <Upload className="w-6 h-6 text-charcoal/40" />
                    </div>
                }
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'cover_photo')}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
                {uploading === 'cover_photo' && (
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
            { label: 'Username', key: 'username', placeholder: '@username' },
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
              <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-1.5">City</label>
              <select value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30">
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
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

          {/* Interests */}
          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_LIST.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.interests.includes(i)
                      ? 'bg-ocean text-white border-ocean'
                      : 'bg-white text-charcoal/60 border-border hover:border-ocean/30'
                  }`}
                >
                  {i}
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
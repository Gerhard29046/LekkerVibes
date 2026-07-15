import React, { useState, useEffect } from 'react';
import { communitiesApi } from '@/api/communitiesApi';
import { locationApi } from '@/api/locationApi';
import { uploadsApi } from '@/api/uploadsApi';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import { ArrowLeft, Upload, Loader2, Users } from 'lucide-react';

export default function CreateClub() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [locations, setLocations] = useState([]);
  const [previews, setPreviews] = useState({});
  const [form, setForm] = useState({
    name: '', description: '', location_id: '',
    join_policy: 'open', guidelines: '',
    cover_media_id: null, logo_media_id: null,
  });

  useEffect(() => {
    locationApi.popular().then(result => setLocations(result.data)).catch(() => setLocations([]));
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(field);
    try {
      const media = await uploadsApi.upload(file);
      set(field, media.id);
      setPreviews(p => ({ ...p, [field]: media.url }));
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: form.name,
        description: form.description || undefined,
        location_id: form.location_id || undefined,
        join_policy: form.join_policy,
        visibility: 'public',
        cover_media_id: form.cover_media_id || undefined,
        logo_media_id: form.logo_media_id || undefined,
        rules: form.guidelines ? [{ title: 'Community Guidelines', description: form.guidelines }] : undefined,
      };
      const club = await communitiesApi.create(data);
      navigate(`/club/${club.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/profile" className="flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-charcoal mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>
        <h1 className="font-heading text-2xl font-bold text-charcoal mb-6">Create a Group</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="bg-white rounded-2xl p-5 border border-sand space-y-4">
            <h3 className="font-heading font-semibold text-charcoal text-sm">Group Images</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: 'cover_media_id', label: 'Cover Image', h: 'h-36' },
                { field: 'logo_media_id', label: 'Logo / Icon', h: 'h-36' },
              ].map(({ field, label, h }) => (
                <div key={field}>
                  <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">{label}</label>
                  <div className={`relative ${h} rounded-xl overflow-hidden bg-sand border-2 border-dashed border-border cursor-pointer`}>
                    {previews[field]
                      ? <img src={previews[field]} alt={label} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-charcoal/40">
                          <Upload className="w-6 h-6" />
                          <span className="text-xs">Upload</span>
                        </div>
                    }
                    <input type="file" accept="image/*" onChange={e => handleUpload(e, field)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {uploading === field && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand space-y-4">
            <h3 className="font-heading font-semibold text-charcoal text-sm">Basic Info</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Group Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Stellenbosch Trail Runners" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={4} placeholder="What is your group about? Who is it for?" className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Location</label>
              <select value={form.location_id} onChange={e => set('location_id', e.target.value ? Number(e.target.value) : '')} className={inputCls}>
                <option value="">Select location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand space-y-4">
            <h3 className="font-heading font-semibold text-charcoal text-sm">Membership</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Join Type</label>
              <select value={form.join_policy} onChange={e => set('join_policy', e.target.value)} className={inputCls}>
                {[
                  { value: 'open', label: 'Open — anyone can join' },
                  { value: 'request', label: 'Approval required' },
                  { value: 'invite_only', label: 'Invite only' },
                ].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand">
            <h3 className="font-heading font-semibold text-charcoal text-sm mb-3">Community Guidelines</h3>
            <textarea value={form.guidelines} onChange={e => set('guidelines', e.target.value)}
              rows={4} placeholder="Set expectations for members: behaviour, respect, communication..."
              className={`${inputCls} resize-none`} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Users className="w-4 h-4" /> Create Group</>}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30";

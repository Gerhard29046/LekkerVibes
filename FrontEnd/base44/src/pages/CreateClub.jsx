import React, { useState } from 'react';
import { communitiesApi } from '@/api/communitiesApi';
import { uploadsApi } from '@/api/uploadsApi';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from '@/hooks/useLocation.jsx';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import { ArrowLeft, Upload, Loader2, Users } from 'lucide-react';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';

const CATEGORIES = [
  'Running', 'Hiking', 'Surfing', 'Cycling', 'Yoga & Wellness',
  'Food & Markets', 'Faith & Community', 'Social & Dining', 'Book Club', 'Gaming',
];

export default function CreateClub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cities, selectedCity } = useLocation();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', city: selectedCity,
    category: '', rules: '', imageURL: null, joinPolicy: 'open',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadsApi.upload(file, `communities/${user.uid}-${Date.now()}`);
      set('imageURL', url);
      setImagePreview(url);
    } catch (err) {
      setUploadError(err.message || 'Upload failed — please try a different image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id } = await communitiesApi.create(form, user);
      navigate(`/club/${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (!FEATURES.communities) {
    return <ComingSoon feature="Creating communities" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/profile" className="flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-charcoal mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>
        <h1 className="font-heading text-2xl font-bold text-charcoal mb-6">Create a Group</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image */}
          <div className="bg-white rounded-2xl p-5 border border-sand space-y-4">
            <h3 className="font-heading font-semibold text-charcoal text-sm">Group Image</h3>
            <div className="relative h-36 rounded-xl overflow-hidden bg-sand border-2 border-dashed border-border cursor-pointer">
              {imagePreview
                ? <img src={imagePreview} alt="Group cover" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-charcoal/40">
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Upload</span>
                  </div>
              }
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              {uploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            {uploadError && <p className="text-xs text-coral">{uploadError}</p>}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">City *</label>
                <select required value={form.city} onChange={e => set('city', e.target.value)} className={inputCls}>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand space-y-3">
            <h3 className="font-heading font-semibold text-charcoal text-sm">Who can join</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => set('joinPolicy', 'open')}
                className={`text-left p-3.5 rounded-xl border text-sm transition-colors ${
                  form.joinPolicy === 'open' ? 'border-ocean bg-ocean/5' : 'border-sand hover:border-ocean/30'
                }`}
              >
                <p className="font-semibold text-charcoal mb-0.5">Public</p>
                <p className="text-xs text-charcoal/60">Anyone can join instantly.</p>
              </button>
              <button
                type="button"
                onClick={() => set('joinPolicy', 'invite_only')}
                className={`text-left p-3.5 rounded-xl border text-sm transition-colors ${
                  form.joinPolicy === 'invite_only' ? 'border-ocean bg-ocean/5' : 'border-sand hover:border-ocean/30'
                }`}
              >
                <p className="font-semibold text-charcoal mb-0.5">Invite-only</p>
                <p className="text-xs text-charcoal/60">Only joinable via a link you share.</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand">
            <h3 className="font-heading font-semibold text-charcoal text-sm mb-3">Community Guidelines</h3>
            <textarea value={form.rules} onChange={e => set('rules', e.target.value)}
              rows={4} placeholder="Set expectations for members: behaviour, respect, communication..."
              className={`${inputCls} resize-none`} />
          </div>

          <button type="submit" disabled={saving || uploading}
            className="w-full py-3.5 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Users className="w-4 h-4" /> Create Group</>}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30";

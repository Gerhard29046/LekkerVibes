import React, { useState, useEffect } from 'react';
import { communitiesApi } from '@/api/communitiesApi';
import { uploadsApi } from '@/api/uploadsApi';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from '@/hooks/useLocation.jsx';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import { ArrowLeft, Upload, Loader2, Save } from 'lucide-react';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';

const CATEGORIES = [
  'Running', 'Hiking', 'Surfing', 'Cycling', 'Yoga & Wellness',
  'Food & Markets', 'Faith & Community', 'Social & Dining', 'Book Club', 'Gaming',
];

export default function EditClub() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cities } = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notAllowed, setNotAllowed] = useState(false);
  const [form, setForm] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (!FEATURES.communities) {
      setLoading(false);
      return;
    }
    communitiesApi.get(id, user?.uid).then(club => {
      if (!club) {
        setNotAllowed(true);
        return;
      }
      const canEdit = club.ownerId === user?.uid || club.myMembership?.role === 'organiser';
      if (!canEdit) {
        setNotAllowed(true);
        return;
      }
      setForm({
        name: club.name, description: club.description || '', city: club.city,
        category: club.category || '', rules: club.rules || '', imageURL: club.imageURL || null,
        joinPolicy: club.joinPolicy || 'open',
        ctaTitle: club.ctaTitle || '', ctaBody: club.ctaBody || '', ctaLinkUrl: club.ctaLinkUrl || '',
      });
      setImagePreview(club.imageURL || '');
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.uid]);

  if (!FEATURES.communities) return <ComingSoon feature="Communities" />;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-sand border-t-ocean rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notAllowed || !form) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-20 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="font-heading text-2xl font-bold text-charcoal mb-2">Can't edit this community</h2>
          <p className="text-sm text-charcoal/60 mb-4">You need to be its owner or an organiser.</p>
          <Link to={`/club/${id}`} className="text-ocean text-sm font-medium">Back to community</Link>
        </div>
      </div>
    );
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadsApi.upload(file, `communities/${id}`);
      set('imageURL', url);
      setImagePreview(url);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await communitiesApi.update(id, {
        ...form,
        ctaTitle: form.ctaTitle.trim() || null,
        ctaBody: form.ctaBody.trim() || null,
        ctaLinkUrl: form.ctaLinkUrl.trim() || null,
      });
      navigate(`/club/${id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to={`/club/${id}`} className="flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-charcoal mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to community
        </Link>
        <h1 className="font-heading text-2xl font-bold text-charcoal mb-6">Edit Community</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
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
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand space-y-4">
            <h3 className="font-heading font-semibold text-charcoal text-sm">Basic Info</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Group Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={4} className={`${inputCls} resize-none`} />
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
              rows={4} className={`${inputCls} resize-none`} />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand space-y-4">
            <div>
              <h3 className="font-heading font-semibold text-charcoal text-sm">Right-panel callout (optional)</h3>
              <p className="text-xs text-charcoal/50 mt-0.5">Shown at the bottom of the Messages page's community panel. Leave blank to show nothing.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Title</label>
              <input value={form.ctaTitle} onChange={e => set('ctaTitle', e.target.value)}
                placeholder="e.g. Love the outdoors?" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Body</label>
              <textarea value={form.ctaBody} onChange={e => set('ctaBody', e.target.value)}
                rows={2} placeholder="e.g. Help keep our trails clean." className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Link URL</label>
              <input type="url" value={form.ctaLinkUrl} onChange={e => set('ctaLinkUrl', e.target.value)}
                placeholder="https://..." className={inputCls} />
            </div>
          </div>

          <button type="submit" disabled={saving || uploading}
            className="w-full py-3.5 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30";

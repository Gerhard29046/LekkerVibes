import React, { useState, useEffect } from 'react';
import { eventsApi, eventCategoriesApi } from '@/api/eventsApi';
import { communitiesApi } from '@/api/communitiesApi';
import { uploadsApi } from '@/api/uploadsApi';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from '@/hooks/useLocation.jsx';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import { ArrowLeft, Upload, Loader2, Save, Ban } from 'lucide-react';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';

const MOODS = [
  'Meet people', 'Be active', 'Something chilled', 'Go out tonight',
  'Something outdoors', 'Alcohol-free', 'Creative', 'Beginner-friendly',
];

export default function EditActivity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cities } = useLocation();
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notAllowed, setNotAllowed] = useState(false);
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState('active');
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (!FEATURES.events) {
      setLoading(false);
      return;
    }
    eventCategoriesApi.list().then(setCategories).catch(() => setCategories([]));
    if (user) communitiesApi.myMemberships(user.uid).then(setClubs).catch(() => setClubs([]));
    eventsApi.get(id, user?.uid).then(async (activity) => {
      if (!activity) {
        setNotAllowed(true);
        return;
      }
      // The host can always edit; for a group-linked event, the
      // community's owner/moderator can too (matches Firebase/
      // firestore.rules' isCommunityAdminFor()).
      let canEdit = activity.organiserId === user?.uid;
      if (!canEdit && activity.communityId && user) {
        const membership = await communitiesApi.get(activity.communityId, user.uid);
        canEdit = membership?.ownerId === user.uid || membership?.myMembership?.role === 'organiser';
      }
      if (!canEdit) {
        setNotAllowed(true);
        return;
      }
      setForm({
        title: activity.title, description: activity.description || '',
        category: activity.category || '', mood: activity.mood || '',
        communityId: activity.communityId || '', date: activity.date,
        startTime: activity.startTime || '', endTime: activity.endTime || '',
        venue: activity.venue || '', address: activity.address || '', city: activity.city,
        capacity: activity.capacity ?? '', visibility: activity.visibility,
        externalUrl: activity.externalUrl || '', imageURL: activity.imageURL || null,
      });
      setStatus(activity.status);
      setImagePreview(activity.imageURL || '');
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.uid]);

  if (!FEATURES.events) return <ComingSoon feature="Activities" />;

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
          <h2 className="font-heading text-2xl font-bold text-charcoal mb-2">Can't edit this activity</h2>
          <p className="text-sm text-charcoal/60 mb-4">Only the host, or the community's owner/moderator, can edit it.</p>
          <Link to={`/activity/${id}`} className="text-ocean text-sm font-medium">Back to activity</Link>
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
      const url = await uploadsApi.upload(file, `events/${id}`);
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
      await eventsApi.update(id, {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        communityId: form.communityId || null,
        category: form.category || null,
        mood: form.mood || null,
      }, user);
      navigate(`/activity/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      await eventsApi.cancel(id, user);
      navigate(`/activity/${id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to={`/activity/${id}`} className="flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-charcoal mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to activity
        </Link>
        <h1 className="font-heading text-2xl font-bold text-charcoal mb-6">Edit Activity</h1>

        {status === 'cancelled' && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-coral/10 text-coral text-sm font-medium">
            This activity is cancelled. Attendees can still see it, but it's marked as cancelled everywhere it's listed.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-2">Cover Image</label>
            <div className="relative h-44 rounded-2xl overflow-hidden bg-sand border-2 border-dashed border-border cursor-pointer">
              {imagePreview
                ? <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-charcoal/40">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">Upload cover image</span>
                  </div>
              }
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              {uploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          <Section title="Basic Info">
            <Field label="Activity Title *">
              <input required value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={4} className={`${inputCls} resize-none`} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Mood">
                <select value={form.mood} onChange={e => set('mood', e.target.value)} className={inputCls}>
                  <option value="">Select mood</option>
                  {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Link to Community">
              <select value={form.communityId} onChange={e => set('communityId', e.target.value)} className={inputCls}>
                <option value="">No community</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="Date & Time">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Date *">
                <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Start Time">
                <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={inputCls} />
              </Field>
              <Field label="End Time">
                <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Location">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Venue">
                <input value={form.venue} onChange={e => set('venue', e.target.value)} className={inputCls} />
              </Field>
              <Field label="City *">
                <select required value={form.city} onChange={e => set('city', e.target.value)} className={inputCls}>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Address / meeting point">
              <textarea value={form.address} onChange={e => set('address', e.target.value)}
                rows={2} className={`${inputCls} resize-none`} />
            </Field>
          </Section>

          <Section title="Capacity & Access">
            <Field label="Max Capacity">
              <input type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Who can join">
              <select value={form.visibility} onChange={e => set('visibility', e.target.value)} className={inputCls}>
                <option value="public">Public — anyone can join</option>
                <option value="members">Members only</option>
              </select>
            </Field>
          </Section>

          <Section title="External link">
            <Field label="Website URL (optional)">
              <input type="url" value={form.externalUrl} onChange={e => set('externalUrl', e.target.value)} className={inputCls} />
            </Field>
          </Section>

          <button type="submit" disabled={saving || uploading}
            className="w-full py-3.5 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>

          {status !== 'cancelled' && (
            <button type="button" onClick={handleCancel} disabled={saving}
              className="w-full py-3 bg-coral/10 text-coral font-semibold rounded-xl hover:bg-coral/20 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
              <Ban className="w-4 h-4" /> Cancel this activity
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30";

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-sand space-y-4">
      <h3 className="font-heading font-semibold text-charcoal text-sm">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

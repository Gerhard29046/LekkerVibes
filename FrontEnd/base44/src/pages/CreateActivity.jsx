import React, { useState, useEffect } from 'react';
import { eventsApi, eventCategoriesApi } from '@/api/eventsApi';
import { communitiesApi } from '@/api/communitiesApi';
import { uploadsApi } from '@/api/uploadsApi';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import { ArrowLeft, Upload, Loader2, Plus } from 'lucide-react';

export default function CreateActivity() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', community_id: '',
    date: '', start_time: '', end_time: '',
    price_cents: 0, is_free: true, capacity: '', is_beginner_friendly: false,
    is_attend_alone_friendly: false, transport_notes: '',
    cover_media_id: null,
  });

  useEffect(() => {
    eventCategoriesApi.list().then(setCategories).catch(() => setCategories([]));
    communitiesApi.list({ mine: 1 }).then(result => setClubs(result.data)).catch(() => setClubs([]));
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const [coverPreview, setCoverPreview] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadsApi.upload(file);
      set('cover_media_id', media.id);
      setCoverPreview(media.url);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const startsAt = `${form.date}T${form.start_time || '09:00'}`;
      const endsAt = form.end_time ? `${form.date}T${form.end_time}` : null;

      const data = {
        title: form.title,
        description: form.description || undefined,
        category_id: form.category_id || undefined,
        community_id: form.community_id || undefined,
        cover_media_id: form.cover_media_id || undefined,
        is_free: form.is_free,
        price_cents: form.is_free ? undefined : Math.round(Number(form.price_cents) * 100),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        is_beginner_friendly: form.is_beginner_friendly,
        is_attend_alone_friendly: form.is_attend_alone_friendly,
        transport_notes: form.transport_notes || undefined,
        occurrences: [{ starts_at: startsAt, ends_at: endsAt }],
      };
      const created = await eventsApi.create(data);
      navigate(`/activity/${created.id}`);
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

        <h1 className="font-heading text-2xl font-bold text-charcoal mb-6">Create an Activity</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover image */}
          <div>
            <label className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide block mb-2">Cover Image</label>
            <div className="relative h-44 rounded-2xl overflow-hidden bg-sand border-2 border-dashed border-border cursor-pointer group">
              {coverPreview
                ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-charcoal/40">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">Upload cover image</span>
                  </div>
              }
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              {uploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          <Section title="Basic Info">
            <Field label="Activity Title *">
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Sunday Morning Parkrun" className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={4} placeholder="Describe your activity..." className={`${inputCls} resize-none`} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={inputCls}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Link to Community">
                <select value={form.community_id} onChange={e => set('community_id', e.target.value)} className={inputCls}>
                  <option value="">No community</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Date & Time">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Date *">
                <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Start Time">
                <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={inputCls} />
              </Field>
              <Field label="End Time">
                <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Meeting point & transport">
            <Field label="How to get there / where to meet">
              <textarea value={form.transport_notes} onChange={e => set('transport_notes', e.target.value)}
                rows={3} placeholder="e.g. Meet at the main entrance of Riebeek Park, street parking available" className={`${inputCls} resize-none`} />
            </Field>
          </Section>

          <Section title="Pricing & Capacity">
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_free} onChange={e => set('is_free', e.target.checked)} className="w-4 h-4 rounded accent-ocean" />
                <span className="text-sm font-medium text-charcoal">This is a free activity</span>
              </label>
            </div>
            {!form.is_free && (
              <Field label="Price (R)">
                <input type="number" min="0" value={form.price_cents} onChange={e => set('price_cents', e.target.value)}
                  placeholder="0" className={inputCls} />
              </Field>
            )}
            <Field label="Max Capacity">
              <input type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)}
                placeholder="Leave empty for unlimited" className={inputCls} />
            </Field>
          </Section>

          <Section title="Welcome Labels">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'is_beginner_friendly', label: 'Beginner friendly' },
                { key: 'is_attend_alone_friendly', label: 'Great to attend solo' },
              ].map(p => (
                <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[p.key]} onChange={e => set(p.key, e.target.checked)} className="w-4 h-4 rounded accent-teal" />
                  <span className="text-sm text-charcoal">{p.label}</span>
                </label>
              ))}
            </div>
          </Section>

          <button type="submit" disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Activity</>}
          </button>
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

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import { ArrowLeft, Upload, Loader2, Plus } from 'lucide-react';

const CATEGORIES = ['Running', 'Hiking', 'Cycling', 'Surfing', 'Yoga', 'Dance', 'Art', 'Music', 'Food & Drink', 'Social', 'Volunteer', 'Faith', 'Sports', 'Fitness', 'Outdoors', 'Other'];
const CITIES = ['Stellenbosch', 'Somerset West', 'Cape Town', 'Paarl', 'Durbanville', 'Bellville', 'George', 'Johannesburg', 'Pretoria', 'Durban'];

export default function CreateActivity() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', city: '', neighbourhood: '',
    venue_name: '', venue_address: '', date: '', start_time: '', end_time: '',
    price: 0, is_free: true, capacity: '', is_beginner_friendly: false,
    is_family_friendly: false, is_attend_alone_friendly: false, is_alcohol_free: false,
    experience_level: 'all_levels', intensity: 'moderate', what_to_bring: '',
    meeting_instructions: '', cover_image: '', club_id: '', status: 'published',
    welcome_labels: []
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const memberships = await base44.entities.ClubMember.filter({ user_id: me.id, status: 'active' });
      if (memberships.length > 0) {
        const clubData = await Promise.all(memberships.map(m => base44.entities.Club.get(m.club_id).catch(() => null)));
        setClubs(clubData.filter(Boolean));
      }
    });
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('cover_image', file_url);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const selectedClub = clubs.find(c => c.id === form.club_id);
    const data = {
      ...form,
      price: form.is_free ? 0 : Number(form.price),
      capacity: form.capacity ? Number(form.capacity) : undefined,
      organiser_id: user?.id,
      organiser_name: user?.full_name,
      club_name: selectedClub?.name || '',
      spots_remaining: form.capacity ? Number(form.capacity) : undefined,
    };
    const created = await base44.entities.Activity.create(data);
    setSaving(false);
    navigate(`/activity/${created.id}`);
  };

  const labelOptions = ['Beginner-friendly', 'Solo-friendly', 'Dog-friendly', 'Family-friendly', 'Alcohol-free', 'All ages welcome', 'Inclusive space'];
  const toggleLabel = (l) => set('welcome_labels', form.welcome_labels.includes(l) ? form.welcome_labels.filter(x => x !== l) : [...form.welcome_labels, l]);

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
              {form.cover_image
                ? <img src={form.cover_image} alt="Cover" className="w-full h-full object-cover" />
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
              <Field label="Category *">
                <select required value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Link to Club">
                <select value={form.club_id} onChange={e => set('club_id', e.target.value)} className={inputCls}>
                  <option value="">No club</option>
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

          <Section title="Location">
            <div className="grid grid-cols-2 gap-4">
              <Field label="City *">
                <select required value={form.city} onChange={e => set('city', e.target.value)} className={inputCls}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Neighbourhood">
                <input value={form.neighbourhood} onChange={e => set('neighbourhood', e.target.value)}
                  placeholder="e.g. De Waterkant" className={inputCls} />
              </Field>
            </div>
            <Field label="Venue Name">
              <input value={form.venue_name} onChange={e => set('venue_name', e.target.value)}
                placeholder="e.g. Riebeek Park" className={inputCls} />
            </Field>
            <Field label="Meeting Instructions">
              <input value={form.meeting_instructions} onChange={e => set('meeting_instructions', e.target.value)}
                placeholder="Where exactly to meet" className={inputCls} />
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
                <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                  placeholder="0" className={inputCls} />
              </Field>
            )}
            <Field label="Max Capacity">
              <input type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)}
                placeholder="Leave empty for unlimited" className={inputCls} />
            </Field>
          </Section>

          <Section title="Activity Details">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Experience Level">
                <select value={form.experience_level} onChange={e => set('experience_level', e.target.value)} className={inputCls}>
                  {['all_levels', 'beginner', 'intermediate', 'advanced'].map(v => (
                    <option key={v} value={v}>{v.replace('_', ' ')}</option>
                  ))}
                </select>
              </Field>
              <Field label="Intensity">
                <select value={form.intensity} onChange={e => set('intensity', e.target.value)} className={inputCls}>
                  {['low', 'moderate', 'high'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>
            </div>
            <Field label="What to Bring">
              <input value={form.what_to_bring} onChange={e => set('what_to_bring', e.target.value)}
                placeholder="e.g. Water bottle, comfortable shoes" className={inputCls} />
            </Field>
          </Section>

          <Section title="Welcome Labels">
            <div className="flex flex-wrap gap-2">
              {labelOptions.map(l => (
                <button key={l} type="button" onClick={() => toggleLabel(l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.welcome_labels.includes(l) ? 'bg-teal text-white border-teal' : 'bg-white text-charcoal/60 border-border hover:border-teal/30'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { key: 'is_beginner_friendly', label: 'Beginner friendly' },
                { key: 'is_family_friendly', label: 'Family friendly' },
                { key: 'is_attend_alone_friendly', label: 'Great to attend solo' },
                { key: 'is_alcohol_free', label: 'Alcohol-free' },
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
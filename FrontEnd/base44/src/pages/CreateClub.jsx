import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import { ArrowLeft, Upload, Loader2, Users } from 'lucide-react';

const CITIES = ['Stellenbosch', 'Somerset West', 'Cape Town', 'Paarl', 'Durbanville', 'Bellville', 'George', 'Johannesburg', 'Pretoria', 'Durban'];
const CATEGORIES = ['Running', 'Hiking', 'Cycling', 'Surfing', 'Yoga', 'Dance', 'Art', 'Music', 'Food & Drink', 'Social', 'Volunteer', 'Faith', 'Sports', 'Fitness', 'Outdoors', 'Book Club', 'Tech', 'Photography'];

export default function CreateClub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', city: '', neighbourhood: '',
    membership_type: 'open', is_free: true, membership_fee: 0,
    categories: [], guidelines: '', cover_image: '', logo: ''
  });

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleCategory = (c) => set('categories', form.categories.includes(c)
    ? form.categories.filter(x => x !== c) : [...form.categories, c]);

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set(field, file_url);
    setUploading(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const club = await base44.entities.Club.create({
      ...form,
      slug,
      membership_fee: form.is_free ? 0 : Number(form.membership_fee),
      organiser_id: user?.id,
      organiser_name: user?.full_name,
      member_count: 1,
      status: 'active',
    });
    // Auto-join as organiser
    await base44.entities.ClubMember.create({ club_id: club.id, user_id: user?.id, role: 'organiser', status: 'active' });
    setSaving(false);
    navigate(`/club/${club.id}`);
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
                { field: 'cover_image', label: 'Cover Image', h: 'h-36' },
                { field: 'logo', label: 'Logo / Icon', h: 'h-36' },
              ].map(({ field, label, h }) => (
                <div key={field}>
                  <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">{label}</label>
                  <div className={`relative ${h} rounded-xl overflow-hidden bg-sand border-2 border-dashed border-border cursor-pointer`}>
                    {form[field]
                      ? <img src={form[field]} alt={label} className="w-full h-full object-cover" />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">City *</label>
                <select required value={form.city} onChange={e => set('city', e.target.value)} className={inputCls}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Neighbourhood</label>
                <input value={form.neighbourhood} onChange={e => set('neighbourhood', e.target.value)}
                  placeholder="e.g. Dorp Street area" className={inputCls} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand space-y-4">
            <h3 className="font-heading font-semibold text-charcoal text-sm">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => toggleCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.categories.includes(c) ? 'bg-ocean text-white border-ocean' : 'bg-white text-charcoal/60 border-border hover:border-ocean/30'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sand space-y-4">
            <h3 className="font-heading font-semibold text-charcoal text-sm">Membership</h3>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Join Type</label>
              <select value={form.membership_type} onChange={e => set('membership_type', e.target.value)} className={inputCls}>
                {[
                  { value: 'open', label: 'Open — anyone can join' },
                  { value: 'approval', label: 'Approval required' },
                  { value: 'invite_only', label: 'Invite only' },
                ].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_free} onChange={e => set('is_free', e.target.checked)} className="w-4 h-4 rounded accent-ocean" />
              <span className="text-sm font-medium text-charcoal">Free to join</span>
            </label>
            {!form.is_free && (
              <div>
                <label className="text-xs font-semibold text-charcoal/60 block mb-1.5">Membership Fee (R/month)</label>
                <input type="number" min="0" value={form.membership_fee} onChange={e => set('membership_fee', e.target.value)} className={inputCls} />
              </div>
            )}
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
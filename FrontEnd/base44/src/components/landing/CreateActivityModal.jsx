import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, MessageCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { eventsApi } from '@/api/eventsApi';
import { communitiesApi } from '@/api/communitiesApi';
import { useAuth } from '@/lib/AuthContext';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public — anyone on LekkerVibes' },
  { value: 'members', label: 'My community only' },
  { value: 'invite_link', label: 'Invite link only' },
];

// Turns a Discover place into a joinable, scheduled LekkerVibes event.
// Opens in place over the current page (a Dialog, not a route change) so
// the host doesn't lose their Discover scroll position/filters. A group
// chat is always created alongside the event — eventsApi.create() handles
// that as one unit, this component only collects the fields.
export default function CreateActivityModal({ place, city, open, onOpenChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [communityId, setCommunityId] = useState('');
  const [myCommunities, setMyCommunities] = useState([]);
  const [capacity, setCapacity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setTitle(`${place.name} meetup`);
    setDate('');
    setTime('');
    setVisibility('public');
    setCommunityId('');
    setCapacity('');
    setError(null);
  }, [open, place.name]);

  useEffect(() => {
    if (visibility !== 'members' || !user?.uid || myCommunities.length) return;
    communitiesApi.myMemberships(user.uid).then(setMyCommunities).catch(() => {});
  }, [visibility, user?.uid, myCommunities.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      setError('Title, date and time are required.');
      return;
    }
    if (visibility === 'members' && !communityId) {
      setError('Choose which community this activity is for.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await eventsApi.create({
        title: title.trim(),
        date,
        startTime: time,
        city,
        address: place.address || '',
        venue: place.name,
        coordinates: place.latitude != null && place.longitude != null
          ? { lat: place.latitude, lng: place.longitude } : null,
        visibility,
        communityId: visibility === 'members' ? communityId : null,
        capacity: capacity ? Number(capacity) : null,
        placeId: place.placeId,
        placeName: place.name,
        placePhotoUrl: place.photoUrl || null,
        externalUrl: place.googleMapsUrl || null,
      }, user);
      onOpenChange(false);
      navigate(`/activity/${id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong creating this activity.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-body flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-ocean" /> Create activity
          </DialogTitle>
          <p className="text-sm text-charcoal/60">at {place.name}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-charcoal/70 mb-1.5" htmlFor="activity-title">
              Activity title
            </label>
            <input
              id="activity-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal/70 mb-1.5" htmlFor="activity-date">Date</label>
              <input
                id="activity-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal/70 mb-1.5" htmlFor="activity-time">Time</label>
              <input
                id="activity-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal/70 mb-1.5" htmlFor="activity-visibility">
              Who can join
            </label>
            <select
              id="activity-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
            >
              {VISIBILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {visibility === 'members' && (
            <div>
              <label className="block text-xs font-medium text-charcoal/70 mb-1.5" htmlFor="activity-community">
                Community
              </label>
              <select
                id="activity-community"
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
              >
                <option value="">Select a community…</option>
                {myCommunities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {myCommunities.length === 0 && (
                <p className="text-xs text-charcoal/50 mt-1.5">You're not a member of any community yet.</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-charcoal/70 mb-1.5" htmlFor="activity-capacity">
              Spots (optional)
            </label>
            <input
              id="activity-capacity"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="No limit"
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
            />
          </div>

          <div className="flex items-start gap-2.5 bg-ocean/5 border border-ocean/10 rounded-xl p-3.5">
            <MessageCircle className="w-4 h-4 text-ocean shrink-0 mt-0.5" />
            <p className="text-xs text-charcoal/60 leading-relaxed">
              A group chat is created automatically so everyone who joins can coordinate.
            </p>
          </div>

          {error && <p className="text-xs text-coral">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            Create event & open chat
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

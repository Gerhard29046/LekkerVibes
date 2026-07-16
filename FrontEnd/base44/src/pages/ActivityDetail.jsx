import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsApi } from '@/api/eventsApi';
import { reportsApi } from '@/api/reportsApi';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import {
  MapPin, Clock, Calendar, Users, Share2, Bookmark,
  ArrowLeft, AlertTriangle, MessageCircle, Flag, Loader2
} from 'lucide-react';
import moment from 'moment';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    eventsApi.get(id)
      .then(setActivity)
      .catch(() => setActivity(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!FEATURES.events) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!FEATURES.events) {
    return <ComingSoon feature="Activities" />;
  }

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

  if (!activity) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-20 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="font-heading text-2xl font-bold text-charcoal mb-2">Activity not found</h2>
          <Link to="/discover" className="text-ocean text-sm font-medium">Back to discover</Link>
        </div>
      </div>
    );
  }

  const occurrence = activity.occurrences?.[0];
  const dateFormatted = occurrence ? moment(occurrence.starts_at).format('dddd, D MMMM YYYY') : null;
  const isFree = activity.is_free;
  const priceRand = activity.price_cents ? Math.round(activity.price_cents / 100) : null;
  const goingCount = occurrence && occurrence.capacity != null && occurrence.spots_remaining != null
    ? occurrence.capacity - occurrence.spots_remaining
    : null;

  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleJoin = async (status) => {
    if (!requireAuth() || !occurrence) return;
    setActionLoading(true);
    try {
      await eventsApi.joinOccurrence(occurrence.id, status);
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!requireAuth()) return;
    setActionLoading(true);
    try {
      if (activity.saved_by_me) {
        await eventsApi.unsave(activity.id);
      } else {
        await eventsApi.save(activity.id);
      }
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = async () => {
    if (!requireAuth()) return;
    await reportsApi.create({ reportableType: 'event', reportableId: activity.id, reason: 'other' });
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero image */}
      <div className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
        <img
          src={activity.cover_url || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600'}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />

        <div className="absolute top-20 left-4 sm:left-6">
          <Link
            to="/discover"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full glass-dark text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="absolute bottom-6 left-4 sm:left-6 right-4 sm:right-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-medium">
              {activity.category?.name || 'Activity'}
            </span>
            {isFree && (
              <span className="px-3 py-1 rounded-full bg-leaf/80 text-white text-xs font-semibold">Free</span>
            )}
            {activity.is_recurring && (
              <span className="px-3 py-1 rounded-full bg-sky/80 text-ocean text-xs font-semibold">Recurring</span>
            )}
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-bold text-white">{activity.title}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 border border-sand">
                <Calendar className="w-5 h-5 text-ocean mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Date</p>
                <p className="text-sm font-semibold text-charcoal">
                  {occurrence ? moment(occurrence.starts_at).format('D MMM') : 'TBC'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand">
                <Clock className="w-5 h-5 text-teal mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Time</p>
                <p className="text-sm font-semibold text-charcoal">
                  {occurrence ? moment(occurrence.starts_at).format('h:mm A') : '—'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand">
                <MapPin className="w-5 h-5 text-coral mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Location</p>
                <p className="text-sm font-semibold text-charcoal truncate">
                  {activity.venue?.name || activity.venue?.location?.name || 'TBC'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand">
                <Users className="w-5 h-5 text-leaf mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Going</p>
                <p className="text-sm font-semibold text-charcoal">
                  {goingCount ?? 0}{occurrence?.capacity ? ` / ${occurrence.capacity}` : ''}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-sand">
              <h2 className="font-heading text-lg font-semibold text-charcoal mb-4">About this activity</h2>
              <p className="text-sm text-charcoal/70 leading-relaxed whitespace-pre-wrap">{activity.description}</p>
            </div>

            {activity.transport_notes && (
              <div className="bg-white rounded-2xl p-6 border border-sand">
                <h3 className="font-heading text-base font-semibold text-charcoal mb-3">Getting there</h3>
                <p className="text-sm text-charcoal/70">{activity.transport_notes}</p>
              </div>
            )}

            {/* Safety reminder */}
            <div className="bg-peach/10 rounded-2xl p-5 border border-peach/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-coral shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-charcoal mb-1">Safety reminder</h4>
                  <p className="text-xs text-charcoal/60 leading-relaxed">
                    Attend first-time meetups in public places. Let someone know where you are going.
                    Keep initial communication inside the LekkerVibes group. Report behaviour that makes you uncomfortable.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Action card */}
            <div className="bg-white rounded-2xl p-6 border border-sand sticky top-24">
              <div className="mb-5">
                <p className="text-2xl font-bold text-charcoal font-heading">
                  {isFree ? 'Free' : priceRand !== null ? `R${priceRand}` : '—'}
                </p>
                {dateFormatted && <p className="text-xs text-charcoal/50">{dateFormatted}</p>}
              </div>

              {occurrence?.spots_remaining != null && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-charcoal/60 mb-1.5">
                    <span>{occurrence.spots_remaining} spots remaining</span>
                    <span>{goingCount ?? 0}/{occurrence.capacity}</span>
                  </div>
                  <div className="h-2 bg-sand rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ocean to-teal rounded-full"
                      style={{ width: `${((goingCount ?? 0) / (occurrence.capacity || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => handleJoin('going')}
                disabled={actionLoading || !occurrence}
                className="w-full py-3 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/20 transition-all mb-3 text-sm disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : occurrence?.my_attendance_status === 'going' ? "You're going!" : 'Join Activity'}
              </button>
              <button
                onClick={() => handleJoin('interested')}
                disabled={actionLoading || !occurrence}
                className="w-full py-3 bg-coral/10 text-coral font-semibold rounded-xl hover:bg-coral/20 transition-colors text-sm mb-4 disabled:opacity-50"
              >
                I'm Interested
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveToggle}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal hover:bg-sand/80 transition-colors disabled:opacity-50"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${activity.saved_by_me ? 'fill-ocean text-ocean' : ''}`} />
                  {activity.saved_by_me ? 'Saved' : 'Save'}
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal hover:bg-sand/80 transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  onClick={handleReport}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal hover:bg-sand/80 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              </div>
            </div>

            {/* Organiser */}
            <div className="bg-white rounded-2xl p-5 border border-sand">
              <h3 className="font-heading text-sm font-semibold text-charcoal mb-3">Organised by</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center text-white font-bold text-sm">
                  {(activity.organiser?.name || 'O')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal flex items-center gap-1">
                    {activity.organiser?.name}
                  </p>
                  {activity.community && (
                    <p className="text-xs text-charcoal/50">{activity.community.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Group chat CTA */}
            {activity.community && (
              <div className="bg-gradient-to-br from-ocean/5 to-teal/5 rounded-2xl p-5 border border-ocean/10">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-ocean" />
                  <h3 className="font-heading text-sm font-semibold text-charcoal">Group Chat</h3>
                </div>
                <p className="text-xs text-charcoal/60 mb-3">
                  Join the community's group conversation to ask questions and connect with other attendees.
                </p>
                <Link to={`/club/${activity.community.id}`} className="block w-full py-2.5 bg-ocean text-white text-xs font-semibold rounded-xl hover:bg-ocean/90 transition-colors text-center">
                  Go to {activity.community.name}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsApi } from '@/api/eventsApi';
import { reportsApi } from '@/api/reportsApi';
import { savedApi } from '@/api/savedApi';
import { activityApi } from '@/api/activityApi';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import {
  MapPin, Clock, Calendar, Users, Share2, ExternalLink, Bookmark,
  ArrowLeft, AlertTriangle, MessageCircle, Flag, Loader2, Pencil, Lock, Navigation
} from 'lucide-react';
import moment from 'moment';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reported, setReported] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    eventsApi.get(id, user?.uid)
      .then((data) => {
        setActivity(data);
        return user ? savedApi.has(user.uid, id) : false;
      })
      .then(setSaved)
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
  }, [id, user?.uid]);

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

  const dateFormatted = activity.date ? moment(activity.date).format('dddd, D MMMM YYYY') : null;
  const timeFormatted = activity.startTime ? moment(activity.startTime, 'HH:mm').format('h:mm A') : null;
  const isOrganiser = activity.organiserId === user?.uid;
  const isGoing = activity.myAttendance?.status === 'going';
  const spotsRemaining = activity.capacity != null ? Math.max(activity.capacity - activity.attendeeCount, 0) : null;

  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleRsvp = async (status) => {
    if (!requireAuth()) return;
    setActionLoading(true);
    try {
      await eventsApi.rsvp(activity.id, user, status);
      if (status === 'going') {
        activityApi.record(user.uid, 'going_event', { eventId: activity.id, eventTitle: activity.title }).catch(() => {});
      }
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await eventsApi.leave(activity.id, user.uid);
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = async () => {
    if (!requireAuth()) return;
    await reportsApi.create({ reportableType: 'event', reportableId: activity.id, reason: 'other', details: undefined }, user);
    setReported(true);
  };

  const handleSaveToggle = async () => {
    if (!requireAuth()) return;
    if (saved) {
      await savedApi.remove(user.uid, activity.id);
    } else {
      await savedApi.add(user.uid, activity.id, {
        type: 'event', title: activity.title, imageURL: activity.imageURL, date: activity.date,
      });
    }
    setSaved(!saved);
  };

  const mapsUrl = activity.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${activity.coordinates.lat},${activity.coordinates.lng}`
    : activity.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.address)}`
      : null;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero image */}
      <div className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
        <img
          src={activity.imageURL || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600'}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />

        <div className="absolute top-20 left-4 sm:left-6 flex items-center gap-2">
          <Link
            to="/discover"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full glass-dark text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          {isOrganiser && (
            <Link
              to={`/activity/${activity.id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full glass-dark text-white text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
          )}
        </div>

        <div className="absolute bottom-6 left-4 sm:left-6 right-4 sm:right-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-medium">
              {activity.category || 'Activity'}
            </span>
            {activity.visibility === 'members' && (
              <span className="px-3 py-1 rounded-full bg-charcoal/80 text-white text-xs font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Members only
              </span>
            )}
            {activity.status === 'cancelled' && (
              <span className="px-3 py-1 rounded-full bg-coral/90 text-white text-xs font-semibold">Cancelled</span>
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
                  {activity.date ? moment(activity.date).format('D MMM') : 'TBC'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand">
                <Clock className="w-5 h-5 text-teal mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Time</p>
                <p className="text-sm font-semibold text-charcoal">{timeFormatted || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand">
                <MapPin className="w-5 h-5 text-coral mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Venue</p>
                <p className="text-sm font-semibold text-charcoal truncate">{activity.venue || 'TBC'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand">
                <Users className="w-5 h-5 text-leaf mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Going</p>
                <p className="text-sm font-semibold text-charcoal">
                  {activity.attendeeCount ?? 0}{activity.capacity ? ` / ${activity.capacity}` : ''}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-sand">
              <h2 className="font-heading text-lg font-semibold text-charcoal mb-4">About this activity</h2>
              <p className="text-sm text-charcoal/70 leading-relaxed whitespace-pre-wrap">{activity.description}</p>
            </div>

            {activity.address && (
              <div className="bg-white rounded-2xl p-6 border border-sand">
                <h3 className="font-heading text-base font-semibold text-charcoal mb-3">Getting there</h3>
                <p className="text-sm text-charcoal/70 mb-3">{activity.address}</p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean hover:text-teal transition-colors"
                  >
                    <Navigation className="w-4 h-4" /> Open directions in Google Maps
                  </a>
                )}
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
              {dateFormatted && <p className="text-xs text-charcoal/50 mb-4">{dateFormatted}</p>}

              {spotsRemaining != null && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-charcoal/60 mb-1.5">
                    <span>{spotsRemaining} spots remaining</span>
                    <span>{activity.attendeeCount ?? 0}/{activity.capacity}</span>
                  </div>
                  <div className="h-2 bg-sand rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ocean to-teal rounded-full"
                      style={{ width: `${((activity.attendeeCount ?? 0) / (activity.capacity || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => isGoing ? handleLeave() : handleRsvp('going')}
                disabled={actionLoading || activity.status === 'cancelled'}
                className={`w-full py-3 font-semibold rounded-xl transition-all mb-3 text-sm disabled:opacity-50 ${
                  isGoing ? 'bg-sand text-charcoal hover:bg-sand/80' : 'bg-gradient-to-r from-ocean to-teal text-white hover:shadow-lg hover:shadow-ocean/20'
                }`}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : isGoing ? "You're going — leave?" : 'Join Activity'}
              </button>
              {!isGoing && (
                <button
                  onClick={() => handleRsvp('interested')}
                  disabled={actionLoading || activity.status === 'cancelled'}
                  className="w-full py-3 bg-coral/10 text-coral font-semibold rounded-xl hover:bg-coral/20 transition-colors text-sm mb-4 disabled:opacity-50"
                >
                  I'm Interested
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveToggle}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    saved ? 'bg-ocean text-white' : 'bg-sand text-charcoal hover:bg-sand/80'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-white' : ''}`} /> {saved ? 'Saved' : 'Save'}
                </button>
                {activity.externalUrl && (
                  <a
                    href={activity.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal hover:bg-sand/80 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Website
                  </a>
                )}
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal hover:bg-sand/80 transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  onClick={handleReport}
                  disabled={reported}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal hover:bg-sand/80 transition-colors disabled:opacity-60"
                >
                  <Flag className="w-3.5 h-3.5" /> {reported ? 'Reported' : 'Report'}
                </button>
              </div>
            </div>

            {/* Organiser */}
            <div className="bg-white rounded-2xl p-5 border border-sand">
              <h3 className="font-heading text-sm font-semibold text-charcoal mb-3">Organised by</h3>
              <Link to={`/u/${activity.organiserId}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center text-white font-bold text-sm">
                  {(activity.organiserName || 'O')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal group-hover:text-ocean transition-colors flex items-center gap-1">
                    {activity.organiserName}
                  </p>
                  {activity.community && (
                    <p className="text-xs text-charcoal/50">{activity.community.name}</p>
                  )}
                </div>
              </Link>
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

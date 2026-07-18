import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { eventsApi } from '@/api/eventsApi';
import { reportsApi } from '@/api/reportsApi';
import { savedApi } from '@/api/savedApi';
import { activityApi } from '@/api/activityApi';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import {
  MapPin, Clock, Calendar, Users, Share2, ExternalLink, Bookmark,
  ArrowLeft, AlertTriangle, MessageCircle, Flag, Loader2, Pencil, Lock, Navigation, Link2, Check
} from 'lucide-react';
import moment from 'moment';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';

export default function ActivityDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [activity, setActivity] = useState(null);
  // Set only when a signed-out-or-not-yet-joined visitor opens an
  // invite_link event via its token — see the note on the Worker call
  // below for why that can't just be a normal eventsApi.get().
  const [invitePreview, setInvitePreview] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reported, setReported] = useState(false);
  const [saved, setSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const load = async () => {
    try {
      const data = await eventsApi.get(id, user?.uid);
      if (data) {
        setActivity(data);
        setInvitePreview(null);
        if (data.myAttendance?.status === 'waitlisted') {
          const promoted = await eventsApi.tryPromoteSelf(id, user).catch(() => false);
          if (promoted) {
            const refreshed = await eventsApi.get(id, user?.uid);
            setActivity(refreshed);
          }
        }
        if (data.visibility === 'public') {
          eventsApi.goingAttendees(id).then(setAttendees).catch(() => setAttendees([]));
        }
        if (user) setSaved(await savedApi.has(user.uid, id));
        return;
      }
      throw new Error('not-found');
    } catch {
      // Not readable via the normal path — could be an invite_link event
      // the caller hasn't joined yet. A Firestore rule can only ever check
      // resource.data/request.auth, never "did this request supply the
      // right token," so that comparison happens server-side instead (see
      // Worker/src/routes/events.ts) — this returns just enough to preview
      // and decide whether to join, not the full event document.
      if (inviteToken) {
        const preview = await eventsApi.resolveInvite(inviteToken).catch(() => null);
        if (preview && preview.id === id) {
          setInvitePreview(preview);
          setActivity(null);
        } else {
          setActivity(null);
        }
      } else {
        setActivity(null);
      }
    }
  };

  useEffect(() => {
    if (!FEATURES.events) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load().finally(() => setLoading(false));
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

  if (!activity && invitePreview) {
    const handleJoinViaInvite = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      setActionLoading(true);
      try {
        // Allowed even though the full event isn't readable yet — an
        // attendee doc is a self-write regardless of the parent event's
        // visibility (see Firebase/firestore.rules). Once it exists, the
        // isEventAttendee() read branch opens up the full event for us.
        await eventsApi.join(id, user);
        await load();
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-24 pb-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-full max-w-md bg-white rounded-2xl border border-sand p-6 text-center">
            {invitePreview.placePhotoUrl && (
              <img src={invitePreview.placePhotoUrl} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
            )}
            <p className="text-xs font-medium text-ocean uppercase tracking-wide mb-2">You've been invited</p>
            <h2 className="font-heading text-xl font-bold text-charcoal mb-2">{invitePreview.title}</h2>
            {invitePreview.placeName && <p className="text-sm text-charcoal/60 mb-1">at {invitePreview.placeName}</p>}
            {invitePreview.date && (
              <p className="text-sm text-charcoal/60 mb-4">
                {moment(invitePreview.date).format('dddd, D MMMM YYYY')}
                {invitePreview.startTime ? ` · ${moment(invitePreview.startTime, 'HH:mm').format('h:mm A')}` : ''}
              </p>
            )}
            <p className="text-xs text-charcoal/50 mb-5">Hosted by {invitePreview.organiserName}</p>
            <button
              onClick={handleJoinViaInvite}
              disabled={actionLoading}
              className="w-full py-3 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'Join this activity'}
            </button>
          </div>
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
  const isWaitlisted = activity.myAttendance?.status === 'waitlisted';
  const spotsRemaining = activity.capacity != null ? Math.max(activity.capacity - activity.attendeeCount, 0) : null;
  const isFull = activity.capacity != null && activity.attendeeCount >= activity.capacity;
  const inviteUrl = activity.visibility === 'invite_link' && activity.inviteToken
    ? `${window.location.origin}/activity/${activity.id}?token=${activity.inviteToken}`
    : null;

  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  // Capacity-aware — may land on 'waitlisted' instead of 'going' if the
  // event is full (see eventsApi.join()).
  const handleJoin = async () => {
    if (!requireAuth()) return;
    setActionLoading(true);
    try {
      const { status } = await eventsApi.join(activity.id, user);
      if (status === 'going') {
        activityApi.record(user.uid, 'going_event', { eventId: activity.id, eventTitle: activity.title }).catch(() => {});
      }
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRsvp = async (status) => {
    if (!requireAuth()) return;
    setActionLoading(true);
    try {
      await eventsApi.rsvp(activity.id, user, status);
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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
            {activity.visibility === 'invite_link' && (
              <span className="px-3 py-1 rounded-full bg-charcoal/80 text-white text-xs font-semibold flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Invite only
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

            {/* Who's going — public events only; members/invite_link events
                keep attendee identities within the group itself. */}
            {activity.visibility === 'public' && attendees.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-sand">
                <h3 className="font-heading text-base font-semibold text-charcoal mb-3">Who's going</h3>
                <div className="flex items-center">
                  {attendees.map((a, i) => (
                    <Link
                      key={a.uid}
                      to={`/u/${a.uid}`}
                      title={a.displayName}
                      className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-ocean to-teal flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ marginLeft: i === 0 ? 0 : -10, zIndex: attendees.length - i }}
                    >
                      {a.photoURL ? <img src={a.photoURL} alt={a.displayName} className="w-full h-full object-cover" /> : (a.displayName || '?')[0]}
                    </Link>
                  ))}
                  <span className="ml-3 text-xs text-charcoal/50">
                    {activity.attendeeCount} going{activity.capacity ? ` · ${activity.capacity} spots` : ''}
                  </span>
                </div>
              </div>
            )}

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
                onClick={() => (isGoing || isWaitlisted) ? handleLeave() : handleJoin()}
                disabled={actionLoading || activity.status === 'cancelled'}
                className={`w-full py-3 font-semibold rounded-xl transition-all mb-3 text-sm disabled:opacity-50 ${
                  (isGoing || isWaitlisted) ? 'bg-sand text-charcoal hover:bg-sand/80' : 'bg-gradient-to-r from-ocean to-teal text-white hover:shadow-lg hover:shadow-ocean/20'
                }`}
              >
                {actionLoading
                  ? <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                  : isGoing ? "You're going — leave?"
                  : isWaitlisted ? "You're on the waitlist — leave?"
                  : isFull ? 'Join waitlist'
                  : 'Join Activity'}
              </button>
              {!isGoing && !isWaitlisted && (
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

            {/* Group chat CTA — every event created via "Create activity" has
                its own dedicated chat (see eventsApi.create()); only
                attendees can actually read it, so this only shows once
                the viewer has joined (or hosts it). Older events created
                before this feature have no chatId and simply don't show it. */}
            {activity.chatId && (isOrganiser || isGoing || isWaitlisted) && (
              <div className="bg-gradient-to-br from-ocean/5 to-teal/5 rounded-2xl p-5 border border-ocean/10">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-ocean" />
                  <h3 className="font-heading text-sm font-semibold text-charcoal">Group Chat</h3>
                </div>
                <p className="text-xs text-charcoal/60 mb-3">
                  Coordinate with everyone who's joined this activity.
                </p>
                <Link to={`/chat/${activity.chatId}`} className="block w-full py-2.5 bg-ocean text-white text-xs font-semibold rounded-xl hover:bg-ocean/90 transition-colors text-center">
                  Open group chat
                </Link>
              </div>
            )}

            {/* Invite link — organiser-only, since it's the credential that
                grants access to an otherwise-unlisted event. */}
            {isOrganiser && inviteUrl && (
              <div className="bg-white rounded-2xl p-5 border border-sand">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-ocean" />
                  <h3 className="font-heading text-sm font-semibold text-charcoal">Invite link</h3>
                </div>
                <p className="text-xs text-charcoal/60 mb-3">
                  Anyone with this link can view and join — it won't appear in search or browse.
                </p>
                <button
                  onClick={handleCopyInviteLink}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-sand text-charcoal text-xs font-semibold rounded-xl hover:bg-sand/80 transition-colors"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5 text-leaf" /> : <Link2 className="w-3.5 h-3.5" />}
                  {linkCopied ? 'Copied!' : 'Copy invite link'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

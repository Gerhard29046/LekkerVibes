import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { profileApi } from '@/api/profileApi';
import { communitiesApi } from '@/api/communitiesApi';
import { eventsApi } from '@/api/eventsApi';
import { followApi } from '@/api/followApi';
import { socialLinksApi, PLATFORMS } from '@/api/socialLinksApi';
import { reportsApi } from '@/api/reportsApi';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { resolveCommunityRole, isCommunityAdmin } from '@/lib/communityRoles';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import FollowListModal from '@/components/landing/FollowListModal';
import {
  MapPin, BadgeCheck, ShieldCheck, Calendar, Users, UserPlus, UserCheck, Clock,
  Instagram, Facebook, Link2, Lock, MoreVertical, Flag, Ban, Crown,
} from 'lucide-react';
import moment from 'moment';

const PLATFORM_LABELS = { instagram: 'Instagram', facebook: 'Facebook', strava: 'Strava', website: 'Website' };
const PLATFORM_ICONS = { instagram: Instagram, facebook: Facebook, strava: Link2, website: Link2 };

export default function PublicProfile() {
  const { uid } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followListOpen, setFollowListOpen] = useState(null); // null | 'followers' | 'following'
  const [relationship, setRelationship] = useState('none'); // none | requested | following
  const [revealStatus, setRevealStatus] = useState(null); // null | pending | accepted
  const [grantedPlatforms, setGrantedPlatforms] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reported, setReported] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuRef = useClickOutside(menuOpen, closeMenu);

  const load = useCallback(async () => {
    const [profileData, memberships, organisedEvents, followers, following] = await Promise.all([
      profileApi.get(uid),
      communitiesApi.myMemberships(uid).catch(() => []),
      eventsApi.byOrganiser(uid).catch(() => []),
      followApi.followerCount(uid).catch(() => 0),
      followApi.followingCount(uid).catch(() => 0),
    ]);
    setProfile(profileData);
    setClubs(memberships);
    setUpcomingEvents(organisedEvents);
    setFollowerCount(followers);
    setFollowingCount(following);

    if (user && profileData) {
      const [state, reveal] = await Promise.all([
        followApi.getRelationshipState(user.uid, uid),
        socialLinksApi.getRevealRequestStatus(user.uid, uid),
      ]);
      setRelationship(state);
      setRevealStatus(reveal?.status || null);
      if (reveal?.status === 'accepted') {
        const grant = await socialLinksApi.getGrant(uid, user.uid);
        const platforms = grant?.platforms || [];
        setGrantedPlatforms(platforms);
        const values = await Promise.all(platforms.map((p) => socialLinksApi.get(uid, p)));
        setSocialLinks(Object.fromEntries(platforms.map((p, i) => [p, values[i]])));
      }
    }
  }, [uid, user]);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [isAuthenticated, load]);

  if (user?.uid === uid) {
    return <Navigate to="/profile" replace />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h2 className="font-body text-2xl font-bold text-charcoal mb-2">Sign in to view this profile</h2>
          <p className="text-sm text-charcoal/60 mb-4">Member profiles are visible to signed-in LekkerVibes members.</p>
          <Link to="/login" className="text-ocean text-sm font-medium">Log in</Link>
        </div>
      </div>
    );
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-20 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="font-body text-2xl font-bold text-charcoal mb-2">Member not found</h2>
          <Link to="/" className="text-ocean text-sm font-medium">Back home</Link>
        </div>
      </div>
    );
  }

  const displayName = profile.displayName || 'Member';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const availablePlatforms = PLATFORMS.filter((p) => profile[`has${p[0].toUpperCase()}${p.slice(1)}`]);

  const handleFollow = async () => {
    setActionLoading(true);
    try {
      await followApi.sendRequest(user.uid, uid);
      setRelationship('requested');
    } finally {
      setActionLoading(false);
    }
  };
  const handleCancelRequest = async () => {
    setActionLoading(true);
    try {
      await followApi.cancelRequest(user.uid, uid);
      setRelationship('none');
    } finally {
      setActionLoading(false);
    }
  };
  const handleUnfollow = async () => {
    setActionLoading(true);
    try {
      await followApi.unfollow(user.uid, uid);
      setRelationship('none');
      setFollowerCount((c) => Math.max(c - 1, 0));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestSocial = async () => {
    setActionLoading(true);
    try {
      await socialLinksApi.requestReveal(user.uid, uid, availablePlatforms);
      setRevealStatus('pending');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = async () => {
    await reportsApi.create({ reportableType: 'user', reportableId: uid, reason: 'other', details: undefined }, user);
    setReported(true);
    setMenuOpen(false);
  };

  const handleBlock = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/users/${uid}/block`);
      setBlocked(true);
      setRelationship('none');
      setMenuOpen(false);
      navigate('/');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="relative h-40 sm:h-56 bg-gradient-to-r from-ocean via-teal to-sky overflow-hidden mt-16">
        {profile.coverURL && <img src={profile.coverURL} alt="Cover" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />

        <div className="absolute top-4 right-4">
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((cur) => !cur)}
              className="p-2 bg-charcoal/70 backdrop-blur text-white rounded-xl hover:bg-charcoal/90 transition-colors"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="public-profile-menu"
              aria-label="Profile options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  id="public-profile-menu"
                  role="menu"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[160px] overflow-hidden rounded-xl border border-sand bg-white py-1 shadow-2xl"
                >
                  <button role="menuitem" onClick={handleReport} disabled={reported}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal hover:bg-sand transition-colors disabled:opacity-50">
                    <Flag className="w-4 h-4" /> {reported ? 'Reported' : 'Report profile'}
                  </button>
                  <button role="menuitem" onClick={handleBlock} disabled={blocked || actionLoading}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-coral hover:bg-sand transition-colors disabled:opacity-50">
                    <Ban className="w-4 h-4" /> Block user
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-12 sm:-mt-14 flex items-end justify-between mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-cream overflow-hidden bg-gradient-to-br from-ocean to-teal flex items-center justify-center shadow-lg">
            {profile.photoURL
              ? <img src={profile.photoURL} alt={displayName} className="w-full h-full object-cover" />
              : <span className="text-white font-body font-bold text-xl">{initials}</span>
            }
          </div>

          {relationship === 'following' ? (
            <button onClick={handleUnfollow} disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-sand rounded-xl text-sm font-semibold text-charcoal hover:bg-sand transition-colors disabled:opacity-60">
              <UserCheck className="w-4 h-4 text-teal" /> Following
            </button>
          ) : relationship === 'requested' ? (
            <button onClick={handleCancelRequest} disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-sand rounded-xl text-sm font-semibold text-charcoal hover:bg-sand transition-colors disabled:opacity-60">
              <Clock className="w-4 h-4 text-charcoal/50" /> Requested
            </button>
          ) : (
            <button onClick={handleFollow} disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ocean to-teal text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60">
              <UserPlus className="w-4 h-4" /> Follow
            </button>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-body text-2xl font-bold text-charcoal">{displayName}</h1>
            {profile.isVerified && <BadgeCheck className="w-5 h-5 text-teal" title="Verified account" />}
            {profile.photoVerified && <ShieldCheck className="w-5 h-5 text-ocean" title="Photo verified live" />}
          </div>
          {profile.username && <p className="text-sm text-charcoal/50 mb-2">@{profile.username}</p>}
          {profile.bio && <p className="text-sm text-charcoal/70 leading-relaxed max-w-xl mb-3">{profile.bio}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-charcoal/60 mb-3">
            {profile.city && (profile.privacy?.cityVisibility !== 'private') && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-coral" />{profile.city}</span>
            )}
            {profile.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-ocean" />
                Member since {moment(profile.createdAt.toDate ? profile.createdAt.toDate() : profile.createdAt).format('MMM YYYY')}
              </span>
            )}
            {(() => {
              const canSeeFollowers = profile.privacy?.followersVisibility === 'everyone'
                || (profile.privacy?.followersVisibility === 'followers' && relationship === 'following');
              const canSeeFollowing = profile.privacy?.followingVisibility === 'everyone'
                || (profile.privacy?.followingVisibility === 'followers' && relationship === 'following');
              return (
                <>
                  {canSeeFollowers && (
                    <button onClick={() => setFollowListOpen('followers')} className="flex items-center gap-1 hover:text-charcoal transition-colors">
                      <Users className="w-4 h-4 text-teal" />{followerCount} followers
                    </button>
                  )}
                  {canSeeFollowing && (
                    <button onClick={() => setFollowListOpen('following')} className="flex items-center gap-1 hover:text-charcoal transition-colors">
                      <Users className="w-4 h-4 text-ocean" />{followingCount} following
                    </button>
                  )}
                </>
              );
            })()}
          </div>
          {profile.interests?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(i => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-sand text-sm text-charcoal font-medium">
                  ✨ {i}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Social links — never shown until an approved reveal grant exists */}
        {availablePlatforms.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-sand mb-6">
            <h3 className="font-body font-semibold text-charcoal mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-charcoal/40" /> Social links
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {availablePlatforms.map((p) => {
                const Icon = PLATFORM_ICONS[p];
                const url = socialLinks[p];
                return url ? (
                  <a key={p} href={url} target="_blank" rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ocean/10 text-ocean text-xs font-medium hover:bg-ocean/20 transition-colors">
                    <Icon className="w-3.5 h-3.5" /> {PLATFORM_LABELS[p]}
                  </a>
                ) : (
                  <span key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sand text-charcoal/50 text-xs font-medium">
                    <Icon className="w-3.5 h-3.5" /> {PLATFORM_LABELS[p]}
                  </span>
                );
              })}
            </div>
            {revealStatus === 'accepted' ? (
              <p className="text-xs text-charcoal/50">Approved: {grantedPlatforms.map((p) => PLATFORM_LABELS[p]).join(', ') || 'none yet'}</p>
            ) : revealStatus === 'pending' ? (
              <p className="text-xs text-charcoal/50 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Request sent — waiting for approval</p>
            ) : (
              <button onClick={handleRequestSocial} disabled={actionLoading}
                className="text-sm font-medium text-ocean hover:text-teal transition-colors disabled:opacity-60">
                Request social links
              </button>
            )}
          </div>
        )}

        {clubs.length > 0 && (
          <div className="mb-8">
            <h3 className="font-body font-semibold text-charcoal mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal" /> Communities
            </h3>
            <div className="flex flex-wrap gap-2">
              {clubs.map(c => (
                <Link key={c.id} to={`/club/${c.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-sand text-sm text-charcoal hover:border-ocean/30 transition-colors">
                  {isCommunityAdmin(resolveCommunityRole(c.ownerId, uid, c.myRole)) && <Crown className="w-3.5 h-3.5 text-peach" title="Admin" />}
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className="mb-12">
            <h3 className="font-body font-semibold text-charcoal mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-ocean" /> Upcoming public events
            </h3>
            <div className="space-y-2">
              {upcomingEvents.map(e => (
                <Link key={e.id} to={`/activity/${e.id}`} className="block bg-white rounded-xl p-4 border border-sand hover:border-ocean/30 transition-colors">
                  <p className="font-medium text-sm text-charcoal">{e.title}</p>
                  <p className="text-xs text-charcoal/50">{moment(e.date).format('ddd, D MMM')}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
      <FollowListModal
        open={!!followListOpen}
        onOpenChange={(v) => setFollowListOpen(v ? followListOpen : null)}
        uid={uid}
        type={followListOpen || 'followers'}
        viewerUid={user?.uid}
      />
    </div>
  );
}

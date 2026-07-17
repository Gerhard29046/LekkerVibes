import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { profileApi } from '@/api/profileApi';
import { uploadsApi } from '@/api/uploadsApi';
import { savedApi, plansApi } from '@/api/savedApi';
import { communitiesApi } from '@/api/communitiesApi';
import { eventsApi } from '@/api/eventsApi';
import { interestsApi } from '@/api/interestsApi';
import { followApi } from '@/api/followApi';
import { groupFollowApi } from '@/api/groupFollowApi';
import { activityApi } from '@/api/activityApi';
import { socialLinksApi } from '@/api/socialLinksApi';
import { useAuth } from '@/lib/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile.jsx';
import { getProfileTheme, colorForLabel } from '@/lib/profileThemes';
import { useAccessibilityPrefs } from '@/lib/accessibilityPrefs';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import ProfileTabBar, { PROFILE_TABS } from '@/components/profile/ProfileTabBar';
import {
  Edit2, MapPin, BadgeCheck, ShieldCheck, Calendar, Users, CalendarClock,
  Briefcase, GraduationCap, Languages, Instagram, Facebook, Link2, ChevronRight,
  Activity as ActivityIcon, Camera, Loader2, X, UserCheck, UserPlus, Image as ImageIcon,
  Sparkles, Star, Bell, BellOff,
} from 'lucide-react';
import moment from 'moment';
import ProfileEditor from '@/components/profile/ProfileEditor';
import CameraCapture from '@/components/profile/CameraCapture';

const VALID_TABS = [...PROFILE_TABS.map((t) => t.id)];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const systemReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState(null);
  const [interests, setInterests] = useState([]);
  const [saved, setSaved] = useState([]);
  const [plans, setPlans] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [followedGroups, setFollowedGroups] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activity, setActivity] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});
  const [editOpen, setEditOpen] = useState(searchParams.get('edit') === '1');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(VALID_TABS.includes(initialTab) ? initialTab : 'Overview');
  const [interestsExpanded, setInterestsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const coverInputRef = useRef(null);
  const { prefs: accessibilityPrefs } = useAccessibilityPrefs(profile, user?.uid);
  const shouldReduceMotion = systemReduceMotion || accessibilityPrefs.reduceMotion;

  const load = async () => {
    const [profileData, interestsData, savedItems, planItems, myClubs, myEvents, followers, following, activityItems, followedGroupsData] = await Promise.all([
      profileApi.get(user.uid),
      interestsApi.list(),
      savedApi.list(user.uid).catch(() => []),
      plansApi.list(user.uid).catch(() => []),
      communitiesApi.myMemberships(user.uid).catch(() => []),
      eventsApi.myPlans(user.uid).catch(() => []),
      followApi.followerCount(user.uid).catch(() => 0),
      followApi.followingCount(user.uid).catch(() => 0),
      activityApi.list(user.uid).catch(() => []),
      groupFollowApi.listFollowedGroups(user.uid).catch(() => []),
    ]);
    setProfile(profileData);
    setInterests(interestsData);
    setSaved(savedItems);
    setPlans([...planItems, ...myEvents.map(e => ({ ...e, type: 'event' }))]);
    setClubs(myClubs);
    setFollowerCount(followers);
    setFollowingCount(following);
    setActivity(activityItems);
    setFollowedGroups(followedGroupsData);

    const ownedPlatforms = ['instagram', 'facebook', 'strava', 'website'].filter(
      (platform) => profileData?.[`has${platform[0].toUpperCase()}${platform.slice(1)}`]
    );
    const linkValues = await Promise.all(ownedPlatforms.map((p) => socialLinksApi.get(user.uid, p)));
    setSocialLinks(Object.fromEntries(ownedPlatforms.map((p, i) => [p, linkValues[i]])));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleProfileSaved = (updated) => {
    setProfile(updated);
    setEditOpen(false);
  };

  const handleAvatarCaptured = async (url) => {
    await profileApi.update(user.uid, { photoURL: url, photoVerified: true });
    setProfile((p) => ({ ...p, photoURL: url, photoVerified: true }));
    setCameraOpen(false);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadsApi.upload(file, `users/${user.uid}`);
      await profileApi.update(user.uid, { coverURL: url });
      setProfile((p) => ({ ...p, coverURL: url }));
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    await profileApi.update(user.uid, { coverURL: null });
    setProfile((p) => ({ ...p, coverURL: null }));
  };

  const handleUnfollowGroup = async (communityId) => {
    await groupFollowApi.unfollow(user.uid, communityId);
    setFollowedGroups((g) => g.filter((x) => x.id !== communityId));
  };

  const handleToggleNotify = async (communityId, current) => {
    await groupFollowApi.setNotify(user.uid, communityId, !current);
    setFollowedGroups((g) => g.map((x) => x.id === communityId ? { ...x, notify: !current } : x));
  };

  const theme = getProfileTheme(profile?.profileTheme);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <ProfileSkeleton />
      </div>
    );
  }

  const displayName = profile?.displayName || 'Member';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const visibleInterests = profile?.interests?.slice(0, 5) || [];
  const extraInterests = (profile?.interests?.length || 0) - visibleInterests.length;
  const eventsJoinedCount = plans.filter(p => p.type === 'event').length;

  const STATS = [
    { label: 'Followers', value: followerCount, icon: UserCheck, onClick: () => navigate('/settings') },
    { label: 'Following', value: followingCount, icon: UserPlus, onClick: () => navigate('/settings') },
    { label: 'Communities', value: clubs.length, icon: Users, onClick: () => setActiveTab('Communities') },
    { label: 'Groups followed', value: followedGroups.length, icon: Bell, onClick: () => setActiveTab('Following groups') },
    { label: 'Events joined', value: eventsJoinedCount, icon: CalendarClock, onClick: () => setActiveTab('Events') },
  ];

  const photoGrid = [profile?.photoURL, profile?.coverURL, ...saved.slice(0, 2).map((s) => s.imageURL || s.photoURL)].filter(Boolean).slice(0, 4);

  return (
    <div className="min-h-screen bg-cream font-body relative overflow-hidden">
      {/* Ambient background motion — behind everything, never blocks interaction */}
      <AmbientBackground reduceMotion={shouldReduceMotion || isMobile || accessibilityPrefs.disableParallax} />

      <Navbar />

      {/* Cover */}
      <div className="relative h-56 sm:h-72 overflow-hidden mt-16">
        {profile?.coverURL ? (
          <motion.img
            src={profile.coverURL}
            alt="Cover"
            className="w-full h-full object-cover"
            initial={shouldReduceMotion ? false : { scale: 1.02 }}
            animate={shouldReduceMotion ? {} : { scale: 1.06 }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ocean via-teal to-sky" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/10 to-[#fffdf8]/85" />

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="absolute inset-0 -m-2 rounded-2xl bg-charcoal/30 blur-md -z-10" aria-hidden="true" />
          <button onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-charcoal/70 backdrop-blur text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-charcoal/90 transition-colors disabled:opacity-60">
            {coverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {coverUploading ? 'Uploading...' : 'Change cover'}
          </button>
          {profile?.coverURL && (
            <button onClick={handleRemoveCover} className="p-2 bg-charcoal/70 backdrop-blur text-white rounded-xl hover:bg-charcoal/90 transition-colors" aria-label="Remove cover photo">
              <X className="w-4 h-4" />
            </button>
          )}
          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="hidden" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Profile information panel — only this panel + the avatar overlap the cover */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative -mt-14 sm:-mt-16 z-10 h-auto min-h-0 bg-white/95 rounded-[24px] border border-slate-200 shadow-[0_8px_30px_rgba(15,76,92,0.08)] px-5 py-6 sm:px-8 sm:py-8"
        >
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[120px_minmax(0,1fr)_240px] lg:gap-7">
            {/* LEFT — profile photo */}
            <div className="flex justify-center lg:justify-start -mt-14 sm:-mt-16 lg:-mt-12">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={shouldReduceMotion ? { duration: 0.3 } : { type: 'spring', stiffness: 180, damping: 18 }}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-[120px] lg:h-[120px] rounded-2xl border-4 border-cream overflow-hidden bg-gradient-to-br from-ocean to-teal flex items-center justify-center shadow-lg shrink-0 transition-shadow hover:shadow-xl"
              >
                {profile?.photoURL
                  ? <img src={profile.photoURL} alt={displayName} className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-3xl">{initials}</span>
                }
                <motion.button
                  onClick={() => setCameraOpen(true)}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.15 }}
                  className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-charcoal/80 backdrop-blur flex items-center justify-center text-white hover:bg-charcoal transition-colors"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>

            {/* CENTRE — identity, bio, info boxes, interests, actions */}
            <div className="min-w-0 text-center lg:text-left">
              <motion.div
                variants={shouldReduceMotion ? undefined : {
                  hidden: {},
                  show: { transition: { staggerChildren: 0.06 } },
                }}
                initial="hidden"
                animate="show"
              >
                <FadeLine reduceMotion={shouldReduceMotion} className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
                  <h1 className="font-body text-2xl sm:text-3xl font-bold text-charcoal">{displayName}</h1>
                  {profile?.isVerified && (
                    <motion.span
                      animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                    >
                      <BadgeCheck className="w-5 h-5 text-teal shrink-0" title="Verified account" />
                    </motion.span>
                  )}
                  {profile?.photoVerified && <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: theme.primary }} title="Photo verified live" />}
                </FadeLine>
                {profile?.username && (
                  <FadeLine reduceMotion={shouldReduceMotion}><p className="mt-1.5 text-sm text-charcoal/50">@{profile.username}</p></FadeLine>
                )}
                <FadeLine reduceMotion={shouldReduceMotion} className="flex flex-wrap justify-center lg:justify-start gap-x-4 gap-y-1 text-sm text-charcoal/60 mt-2">
                  {profile?.city && (
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-coral" />{profile.city}</span>
                  )}
                  {profile?.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" style={{ color: theme.primary }} />
                      Member since {moment(profile.createdAt.toDate ? profile.createdAt.toDate() : profile.createdAt).format('MMM YYYY')}
                    </span>
                  )}
                </FadeLine>
              </motion.div>

              {(profile?.bio || profile?.interests?.length > 0 || profile?.work || profile?.education || profile?.languages?.length > 0 || socialLinks.instagram || socialLinks.facebook || socialLinks.website) && (
                <div className="mt-[18px] grid gap-3 sm:grid-cols-2">
                  {profile?.bio && (
                    <ProfileInfoBox icon={Sparkles} label="About me" colour="coral" reduceMotion={shouldReduceMotion} fullWidth>
                      {profile.bio}
                    </ProfileInfoBox>
                  )}
                  {profile?.interests?.length > 0 && (
                    <ProfileInfoBox icon={Star} label="My vibe" colour="lime" reduceMotion={shouldReduceMotion} fullWidth>
                      <div className="flex flex-wrap gap-2">
                        {(interestsExpanded ? profile.interests : visibleInterests).map((i, idx) => (
                          <InterestChip key={i} label={i} index={idx} reduceMotion={shouldReduceMotion} chipStyle={profile?.chipStyle} />
                        ))}
                        {!interestsExpanded && extraInterests > 0 && (
                          <button
                            onClick={() => setInterestsExpanded(true)}
                            className="px-3 py-1.5 rounded-full bg-white/70 text-xs font-bold text-charcoal/60 hover:text-charcoal transition-colors"
                          >
                            +{extraInterests} more
                          </button>
                        )}
                      </div>
                    </ProfileInfoBox>
                  )}
                  {profile?.work && (
                    <ProfileInfoBox icon={Briefcase} label="Work" colour="teal" reduceMotion={shouldReduceMotion}>
                      {profile.work}
                    </ProfileInfoBox>
                  )}
                  {profile?.education && (
                    <ProfileInfoBox icon={GraduationCap} label="Education" colour="sky" reduceMotion={shouldReduceMotion}>
                      {profile.education}
                    </ProfileInfoBox>
                  )}
                  {profile?.languages?.length > 0 && (
                    <ProfileInfoBox icon={Languages} label="Languages" colour="peach" reduceMotion={shouldReduceMotion}>
                      {profile.languages.join(', ')}
                    </ProfileInfoBox>
                  )}
                  {(socialLinks.instagram || socialLinks.facebook || socialLinks.website) && (
                    <ProfileInfoBox icon={Link2} label="Social links" colour="lavender" reduceMotion={shouldReduceMotion}>
                      <div className="flex items-center gap-3">
                        {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer nofollow" className="hover:opacity-70 transition-opacity"><Instagram className="w-4 h-4" /></a>}
                        {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer nofollow" className="hover:opacity-70 transition-opacity"><Facebook className="w-4 h-4" /></a>}
                        {socialLinks.website && <a href={socialLinks.website} target="_blank" rel="noopener noreferrer nofollow" className="hover:opacity-70 transition-opacity"><Link2 className="w-4 h-4" /></a>}
                      </div>
                    </ProfileInfoBox>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <motion.button
                  onClick={() => setEditOpen(true)}
                  whileHover={shouldReduceMotion ? {} : { y: -2 }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-shadow hover:shadow-md"
                  style={{ background: theme.primary }}
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit profile
                </motion.button>
              </div>
            </div>

            {/* RIGHT — statistics, desktop */}
            <aside className="hidden lg:block lg:border-l lg:border-stone-200 lg:pl-7">
              <div className="flex flex-col gap-2.5">
                {STATS.map((s, i) => (
                  <StatCard key={s.label} stat={s} theme={theme} index={i} reduceMotion={shouldReduceMotion} />
                ))}
              </div>
            </aside>

            {/* Statistics, mobile */}
            <div className="grid grid-cols-2 gap-3 lg:hidden">
              {STATS.map((s, i) => (
                <StatCard key={s.label} stat={s} theme={theme} index={i} reduceMotion={shouldReduceMotion} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Full-width tab bar — shared with Settings so both pages match exactly */}
        <ProfileTabBar activeId={activeTab} theme={theme} reduceMotion={shouldReduceMotion} onTabSelect={setActiveTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                <div className="lg:col-span-1 space-y-6">
                  <Card title="About me" icon={Sparkles} accent={theme} reduceMotion={shouldReduceMotion}>
                    {profile?.bio
                      ? <p className="text-sm text-charcoal/70 leading-relaxed mb-4">{profile.bio}</p>
                      : <p className="text-sm text-charcoal/40 mb-4">No bio yet.</p>}
                    <div className="space-y-2.5 text-sm">
                      {profile?.work && (
                        <div className="flex items-center gap-2 text-charcoal/70">
                          <Briefcase className="w-4 h-4 text-charcoal/40 shrink-0" /> {profile.work}
                        </div>
                      )}
                      {profile?.education && (
                        <div className="flex items-center gap-2 text-charcoal/70">
                          <GraduationCap className="w-4 h-4 text-charcoal/40 shrink-0" /> {profile.education}
                        </div>
                      )}
                      {profile?.languages?.length > 0 && (
                        <div className="flex items-center gap-2 text-charcoal/70">
                          <Languages className="w-4 h-4 text-charcoal/40 shrink-0" /> {profile.languages.join(', ')}
                        </div>
                      )}
                      {!profile?.work && !profile?.education && !profile?.languages?.length && (
                        <p className="text-charcoal/40">No details added yet.</p>
                      )}
                    </div>
                    {(socialLinks.instagram || socialLinks.facebook || socialLinks.strava || socialLinks.website) && (
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sand">
                        {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer nofollow" className="text-charcoal/50 hover:text-ocean transition-colors"><Instagram className="w-5 h-5" /></a>}
                        {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer nofollow" className="text-charcoal/50 hover:text-ocean transition-colors"><Facebook className="w-5 h-5" /></a>}
                        {socialLinks.website && <a href={socialLinks.website} target="_blank" rel="noopener noreferrer nofollow" className="text-charcoal/50 hover:text-ocean transition-colors"><Link2 className="w-5 h-5" /></a>}
                      </div>
                    )}
                    <motion.button onClick={() => setEditOpen(true)} whileHover={shouldReduceMotion ? {} : { x: 2 }}
                      className="mt-4 flex items-center gap-1.5 text-sm font-semibold transition-colors" style={{ color: theme.primary }}>
                      <Edit2 className="w-3.5 h-3.5" /> Edit details
                    </motion.button>
                  </Card>

                  <Card title="My vibe" icon={Sparkles} subtitle="Top activities you enjoy" accent="coral" reduceMotion={shouldReduceMotion}>
                    {profile?.interests?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((i, idx) => <InterestChip key={i} label={i} index={idx} reduceMotion={shouldReduceMotion} chipStyle={profile?.chipStyle} />)}
                      </div>
                    ) : (
                      <p className="text-sm text-charcoal/40">Add your interests from Edit profile.</p>
                    )}
                  </Card>

                  <Card title="Photos" icon={ImageIcon} accent="sky" reduceMotion={shouldReduceMotion}
                    action={photoGrid.length > 0 && <span className="text-xs font-semibold" style={{ color: theme.primary }}>View all</span>}>
                    {photoGrid.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {photoGrid.map((src, i) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden bg-sand">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-charcoal/40">Your profile and cover photos will show up here.</p>
                    )}
                  </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <Card title={`My communities (${clubs.length})`} icon={Users} accent="lime" reduceMotion={shouldReduceMotion}
                    action={clubs.length > 0 && (
                      <button onClick={() => setActiveTab('Communities')} className="text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-0.5" style={{ color: theme.primary }}>
                        View all <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}>
                    {clubs.length === 0 ? (
                      <EmptyState text="No communities joined yet." linkTo="/clubs" linkLabel="Browse communities" />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {clubs.slice(0, 3).map(c => <CommunityMiniCard key={c.id} club={c} theme={theme} />)}
                      </div>
                    )}
                  </Card>

                  <Card title="Upcoming events" icon={Calendar} accent="peach" reduceMotion={shouldReduceMotion}
                    action={eventsJoinedCount > 0 && (
                      <button onClick={() => setActiveTab('Events')} className="text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-0.5" style={{ color: theme.primary }}>
                        View all <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}>
                    {eventsJoinedCount === 0 ? (
                      <EmptyState text="No upcoming events." linkTo="/discover" linkLabel="Discover something" />
                    ) : (
                      <div className="space-y-3">
                        {plans.filter(p => p.type === 'event').slice(0, 3).map(e => (
                          <Link key={e.id} to={`/activity/${e.id}`} className="flex items-center gap-3 group p-2 -mx-2 rounded-xl hover:bg-cream transition-colors">
                            <img src={e.imageURL || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200'} alt={e.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-charcoal group-hover:opacity-80 transition-opacity line-clamp-1">{e.title}</p>
                              <p className="text-xs text-charcoal/50">{e.date ? moment(e.date).format('ddd, D MMM · HH:mm') : ''}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0" style={{ background: theme.soft, color: theme.text }}>Going</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card title="Recent activity" icon={ActivityIcon} accent="teal" reduceMotion={shouldReduceMotion}>
                    {activity.length === 0 ? (
                      <EmptyState text="Nothing here yet." />
                    ) : (
                      <div className="relative space-y-4 before:content-[''] before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-sand">
                        {activity.slice(0, 5).map((item, idx) => (
                          <motion.div key={item.id} initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}
                            className="relative flex items-start gap-3 pl-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 z-10" style={{ background: theme.soft }}>
                              <ActivityIcon className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-charcoal/80">{describeActivity(item)}</p>
                              <p className="text-xs text-charcoal/40 mt-0.5">
                                {item.createdAt ? moment(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).fromNow() : ''}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'Communities' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {clubs.length === 0 && <EmptyState text="No communities joined yet." linkTo="/clubs" linkLabel="Browse communities" fullWidth />}
                {clubs.map(c => <CommunityMiniCard key={c.id} club={c} theme={theme} tall />)}
              </div>
            )}

            {activeTab === 'Following groups' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {followedGroups.length === 0 && (
                  <EmptyState text="You're not following any groups yet — follow a community to get updates without joining." linkTo="/clubs" linkLabel="Browse communities" fullWidth />
                )}
                {followedGroups.map(g => (
                  <div key={g.id} className="bg-white rounded-xl overflow-hidden border border-sand card-hover">
                    <Link to={`/club/${g.id}`} className="block">
                      {g.imageURL ? <img src={g.imageURL} alt={g.name} className="w-full h-28 object-cover" /> : <div className="w-full h-28 bg-gradient-to-br from-ocean to-teal" />}
                    </Link>
                    <div className="p-3">
                      <Link to={`/club/${g.id}`} className="font-semibold text-sm text-charcoal line-clamp-1 hover:opacity-80 transition-opacity">{g.name}</Link>
                      <p className="text-xs text-charcoal/50 mt-0.5">{[g.category, g.city].filter(Boolean).join(' · ')}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => handleUnfollowGroup(g.id)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: theme.soft, color: theme.text }}>
                          Following
                        </button>
                        <button onClick={() => handleToggleNotify(g.id, g.notify)}
                          className="p-1.5 rounded-lg bg-sand text-charcoal/60 hover:text-charcoal transition-colors"
                          aria-label={g.notify ? 'Turn off notifications' : 'Turn on notifications'}>
                          {g.notify === false ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Events' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {eventsJoinedCount === 0 && <EmptyState text="No events joined yet." linkTo="/discover" linkLabel="Discover something" fullWidth />}
                {plans.filter(p => p.type === 'event').map(p => (
                  <Link key={p.id} to={`/activity/${p.id}`} className="bg-white rounded-xl overflow-hidden border border-sand card-hover">
                    <img src={p.imageURL || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400'} alt={p.title} className="w-full h-32 object-cover" />
                    <div className="p-3">
                      <p className="font-semibold text-sm text-charcoal line-clamp-1">{p.title}</p>
                      <p className="text-xs text-charcoal/50 mt-0.5">{p.date ? moment(p.date).format('D MMM') : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'Saved' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {saved.length === 0 && <EmptyState text="Nothing saved yet." linkTo="/discover" linkLabel="Discover activities" fullWidth />}
                {saved.map(s => (
                  <Link key={s.id} to={s.type === 'event' ? `/activity/${s.id}` : (s.googleMapsUrl || '#')}
                    target={s.type === 'event' ? undefined : '_blank'}
                    rel={s.type === 'event' ? undefined : 'noopener noreferrer'}
                    className="bg-white rounded-xl overflow-hidden border border-sand card-hover">
                    <img src={s.imageURL || s.photoURL || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400'} alt={s.title || s.name} className="w-full h-32 object-cover" />
                    <div className="p-3">
                      <p className="font-semibold text-sm text-charcoal line-clamp-1">{s.title || s.name}</p>
                      <p className="text-xs text-charcoal/50 mt-0.5">{s.date ? moment(s.date).format('D MMM') : (s.address || '')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'Activity' && (
              <div className="bg-white rounded-2xl border border-sand divide-y divide-sand mb-12 shadow-sm">
                {activity.length === 0 && (
                  <div className="text-center py-12 text-charcoal/40">
                    <ActivityIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No activity recorded yet.</p>
                  </div>
                )}
                {activity.map(item => (
                  <div key={item.id} className="p-4 text-sm">
                    <p className="text-charcoal/80">{describeActivity(item)}</p>
                    <p className="text-xs text-charcoal/40 mt-0.5">
                      {item.createdAt ? moment(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).fromNow() : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />

      {editOpen && (
        <ProfileEditor
          profile={profile}
          interests={interests}
          currentUser={user}
          onSave={handleProfileSaved}
          onClose={() => setEditOpen(false)}
        />
      )}
      {cameraOpen && (
        <CameraCapture
          folder={`users/${user.uid}`}
          onCaptured={handleAvatarCaptured}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}

function FadeLine({ reduceMotion, className, children }) {
  return (
    <motion.div
      variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ stat, theme, index, reduceMotion }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      onClick={stat.onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      initial={reduceMotion ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.06 }}
      whileHover={reduceMotion ? {} : { y: -3 }}
      className="bg-white rounded-xl px-4 py-3 border border-sand shadow-sm flex items-center gap-3 text-left transition-shadow hover:shadow-md"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ background: hover ? theme.primary : theme.soft }}>
        <stat.icon className="w-4 h-4 transition-colors" style={{ color: hover ? '#fff' : theme.primary }} />
      </div>
      <div>
        <motion.p animate={reduceMotion ? {} : { scale: hover ? 1.08 : 1 }} className="font-bold text-charcoal text-lg leading-none">{stat.value}</motion.p>
        <p className="text-[11px] text-charcoal/50 leading-tight mt-0.5">{stat.label}</p>
      </div>
    </motion.button>
  );
}

function accentColor(accent) {
  if (typeof accent === 'object') return accent.primary;
  return getProfileTheme(accent).primary;
}

function Card({ title, icon: Icon, subtitle, action, accent, reduceMotion, children }) {
  const color = accentColor(accent);
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45 }}
      whileHover={reduceMotion ? {} : { y: -4 }}
      className="relative rounded-[22px] border border-slate-200 bg-white/95 p-6 shadow-[0_8px_30px_rgba(15,76,92,0.06)] transition-all hover:shadow-[0_12px_36px_rgba(15,76,92,0.12)] hover:border-slate-300 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} aria-hidden="true" />
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-body font-bold text-charcoal text-base flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}1A` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </span>
          {title}
        </h3>
        {action}
      </div>
      {subtitle && <p className="text-xs text-charcoal/50 mb-3 ml-9">{subtitle}</p>}
      {!subtitle && <div className="mb-2" />}
      {children}
    </motion.section>
  );
}

// Bold, colour-blocked tile for a single fact in the profile header's centre
// column (bio, vibe, work, education, languages, social links) — deliberately
// louder than the plain <Card> above, to match the "vibe" mood-selector cards
// elsewhere on the site rather than reading as loose floating text.
function ProfileInfoBox({ icon: Icon, label, colour, reduceMotion, fullWidth, children }) {
  const c = getProfileTheme(colour);
  return (
    <motion.div
      whileHover={reduceMotion ? {} : { y: -4, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 250, damping: 18 }}
      className={`relative overflow-hidden rounded-2xl border-2 p-4 shadow-sm transition-shadow hover:shadow-lg text-left ${fullWidth ? 'sm:col-span-2' : ''}`}
      style={{ borderColor: c.border, background: c.soft }}
    >
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: c.primary }} aria-hidden="true" />
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className="w-4 h-4 shrink-0" style={{ color: c.primary }} />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: c.text }}>{label}</span>
        </div>
        <div className="text-sm leading-6" style={{ color: c.text }}>{children}</div>
      </div>
    </motion.div>
  );
}

function InterestChip({ label, index, reduceMotion, chipStyle = 'vibrant' }) {
  const color = colorForLabel(label);
  const minimal = chipStyle === 'minimal';
  return (
    <motion.span
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      animate={reduceMotion || minimal ? {} : { y: [0, -3, 0] }}
      transition={reduceMotion ? { duration: 0.2 } : { y: { duration: 2.5 + (index % 3) * 0.3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 } }}
      whileHover={reduceMotion ? {} : { y: -2, scale: 1.03 }}
      whileTap={reduceMotion ? {} : { scale: 0.97 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm cursor-default"
      style={minimal
        ? { background: '#fff', color: color.text, border: `1.5px solid ${color.border}` }
        : { background: color.soft, color: color.text, border: `1px solid ${color.border}` }}
    >
      {label}
    </motion.span>
  );
}

function CommunityMiniCard({ club: c, theme, tall }) {
  return (
    <Link to={`/club/${c.id}`} className="group rounded-xl overflow-hidden border border-sand transition-all hover:shadow-lg"
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}>
      <div className={`overflow-hidden ${tall ? 'h-32' : 'h-24'}`}>
        {c.imageURL
          ? <img src={c.imageURL} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
          : <div className="w-full h-full bg-gradient-to-br from-ocean to-teal" />}
      </div>
      <div className="p-2.5 bg-white flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-charcoal line-clamp-1">{c.name}</p>
          <p className="text-[11px] text-charcoal/50">{c.memberCount != null ? `${c.memberCount} members` : (c.myRole || '')}</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-charcoal/30 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </div>
    </Link>
  );
}

function EmptyState({ text, linkTo, linkLabel, fullWidth }) {
  return (
    <div className={`text-center py-10 text-charcoal/40 ${fullWidth ? 'col-span-full' : ''}`}>
      <p className="text-sm">{text}</p>
      {linkTo && <Link to={linkTo} className="text-ocean text-sm font-medium mt-2 inline-block">{linkLabel} →</Link>}
    </div>
  );
}

function AmbientBackground({ reduceMotion }) {
  if (reduceMotion) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      <motion.div
        className="absolute -left-24 top-[420px] w-72 h-72 rounded-full bg-teal-400/10 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-80px] top-[120px] w-64 h-64 rounded-full bg-coral/10 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/3 bottom-[-100px] w-80 h-80 rounded-full bg-sky/15 blur-3xl"
        animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-56 sm:h-72 bg-sand mt-16" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-14 sm:-mt-16 bg-white rounded-[24px] border border-sand p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-sand shrink-0 mx-auto sm:mx-0" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-sand rounded w-48 mx-auto sm:mx-0" />
              <div className="h-4 bg-sand rounded w-32 mx-auto sm:mx-0" />
              <div className="h-4 bg-sand rounded w-64 mx-auto sm:mx-0" />
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white border border-sand rounded-[22px]" />)}
        </div>
      </div>
    </div>
  );
}

function describeActivity(item) {
  switch (item.type) {
    case 'joined_community': return `You joined ${item.communityName || 'a community'}`;
    case 'created_event': return `You created ${item.eventTitle || 'an event'}`;
    case 'going_event': return `You're going to ${item.eventTitle || 'an event'}`;
    case 'saved_place': return `You saved ${item.placeName || 'a place'}`;
    case 'visited_place': return `You marked ${item.placeName || 'a place'} as visited`;
    case 'uploaded_photo': return 'You uploaded a new photo';
    default: return 'Activity';
  }
}

import React, { useState, useEffect, useRef } from 'react';
import { profileApi } from '@/api/profileApi';
import { uploadsApi } from '@/api/uploadsApi';
import { savedApi, plansApi } from '@/api/savedApi';
import { communitiesApi } from '@/api/communitiesApi';
import { eventsApi } from '@/api/eventsApi';
import { interestsApi } from '@/api/interestsApi';
import { followApi } from '@/api/followApi';
import { activityApi } from '@/api/activityApi';
import { socialLinksApi } from '@/api/socialLinksApi';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import {
  Edit2, MapPin, BadgeCheck, ShieldCheck, Calendar, Users, Bookmark, CalendarClock,
  Settings, Briefcase, GraduationCap, Languages, Instagram, Facebook, Link2, ChevronRight,
  Activity as ActivityIcon, Camera, Loader2, X, LayoutGrid, UserCheck, UserPlus, Image as ImageIcon, Sparkles,
} from 'lucide-react';
import moment from 'moment';
import ProfileEditor from '@/components/profile/ProfileEditor';
import CameraCapture from '@/components/profile/CameraCapture';

const TABS = [
  { id: 'Overview', icon: LayoutGrid },
  { id: 'Communities', icon: Users },
  { id: 'Events', icon: Calendar },
  { id: 'Saved', icon: Bookmark },
  { id: 'Activity', icon: ActivityIcon },
];

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [interests, setInterests] = useState([]);
  const [saved, setSaved] = useState([]);
  const [plans, setPlans] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activity, setActivity] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});
  const [editOpen, setEditOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const coverInputRef = useRef(null);

  const load = async () => {
    const [profileData, interestsData, savedItems, planItems, myClubs, myEvents, followers, following, activityItems] = await Promise.all([
      profileApi.get(user.uid),
      interestsApi.list(),
      savedApi.list(user.uid).catch(() => []),
      plansApi.list(user.uid).catch(() => []),
      communitiesApi.myMemberships(user.uid).catch(() => []),
      eventsApi.myPlans(user.uid).catch(() => []),
      followApi.followerCount(user.uid).catch(() => 0),
      followApi.followingCount(user.uid).catch(() => 0),
      activityApi.list(user.uid).catch(() => []),
    ]);
    setProfile(profileData);
    setInterests(interestsData);
    setSaved(savedItems);
    setPlans([...planItems, ...myEvents.map(e => ({ ...e, type: 'event' }))]);
    setClubs(myClubs);
    setFollowerCount(followers);
    setFollowingCount(following);
    setActivity(activityItems);

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

  const displayName = profile?.displayName || 'Member';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const visibleInterests = profile?.interests?.slice(0, 5) || [];
  const extraInterests = (profile?.interests?.length || 0) - visibleInterests.length;
  const eventsJoinedCount = plans.filter(p => p.type === 'event').length;

  const STATS = [
    { label: 'Followers', value: followerCount, icon: UserCheck },
    { label: 'Following', value: followingCount, icon: UserPlus },
    { label: 'Communities', value: clubs.length, icon: Users },
    { label: 'Events joined', value: eventsJoinedCount, icon: CalendarClock },
  ];

  const photoGrid = [profile?.photoURL, profile?.coverURL, ...saved.slice(0, 2).map((s) => s.imageURL || s.photoURL)].filter(Boolean).slice(0, 4);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Cover */}
      <div className="relative h-56 sm:h-80 overflow-hidden mt-16">
        {profile?.coverURL ? (
          <img src={profile.coverURL} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ocean via-teal to-sky" />
        )}
        {/* Soft fade so the cover reads as a backdrop, not a competing image */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/15 to-white/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/10 via-transparent to-transparent" />

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header: profile info + vertical stats */}
        <div className="relative -mt-16 sm:-mt-20 mb-6 bg-white/0 flex flex-col lg:flex-row lg:items-end gap-6">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-cream overflow-hidden bg-gradient-to-br from-ocean to-teal flex items-center justify-center shadow-lg shrink-0">
              {profile?.photoURL
                ? <img src={profile.photoURL} alt={displayName} className="w-full h-full object-cover" />
                : <span className="text-white font-heading font-bold text-3xl">{initials}</span>
              }
              <button onClick={() => setCameraOpen(true)}
                className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-charcoal/80 backdrop-blur flex items-center justify-center text-white hover:bg-charcoal transition-colors"
                aria-label="Change profile photo">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal">{displayName}</h1>
                {profile?.isVerified && <BadgeCheck className="w-5 h-5 text-teal shrink-0" title="Verified account" />}
                {profile?.photoVerified && <ShieldCheck className="w-5 h-5 text-ocean shrink-0" title="Photo verified live" />}
              </div>
              {profile?.username && <p className="text-sm text-charcoal/50 mb-1">@{profile.username}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-charcoal/60">
                {profile?.city && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-coral" />{profile.city}</span>
                )}
                {profile?.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-ocean" />
                    Member since {moment(profile.createdAt.toDate ? profile.createdAt.toDate() : profile.createdAt).format('MMM YYYY')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vertical divider (desktop only) */}
          <div className="hidden lg:block w-px self-stretch bg-sand mx-2" aria-hidden="true" />

          {/* Stats: vertical column on desktop, 2-col grid on mobile */}
          <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2.5 lg:gap-3 lg:w-44 shrink-0">
            {STATS.map(s => (
              <div key={s.label} className="bg-white rounded-xl px-4 py-3 border border-sand shadow-sm flex items-center gap-3 lg:justify-start">
                <s.icon className="w-4 h-4 text-ocean shrink-0" />
                <div>
                  <p className="font-heading font-bold text-charcoal text-lg leading-none">{s.value}</p>
                  <p className="text-[11px] text-charcoal/50 leading-tight mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio + interests */}
        <div className="mb-6">
          {profile?.bio && <p className="text-sm text-charcoal/70 leading-relaxed max-w-xl mb-3">{profile.bio}</p>}
          {visibleInterests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleInterests.map(i => (
                <span key={i} className="px-3 py-1 rounded-full bg-white border border-sand text-xs font-medium text-charcoal">{i}</span>
              ))}
              {extraInterests > 0 && (
                <span className="px-3 py-1 rounded-full bg-sand text-xs font-medium text-charcoal/60">+{extraInterests} more</span>
              )}
            </div>
          )}
          <button onClick={() => setEditOpen(true)} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-ocean hover:text-teal transition-colors">
            <Edit2 className="w-3.5 h-3.5" /> Edit profile
          </button>
        </div>

        {/* Full-width tab bar */}
        <div className="border-b-2 border-sand mb-8 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 sm:px-6 py-4 text-sm font-bold whitespace-nowrap border-b-[3px] -mb-0.5 transition-colors ${
                  activeTab === tab.id ? 'text-teal border-teal' : 'text-charcoal/50 border-transparent hover:text-charcoal'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.id}
              </button>
            ))}
            <Link to="/settings"
              className="flex items-center gap-2 px-5 sm:px-6 py-4 text-sm font-bold whitespace-nowrap border-b-[3px] border-transparent text-charcoal/50 hover:text-charcoal transition-colors">
              <Settings className="w-4 h-4" /> Settings
            </Link>
          </div>
        </div>

        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Narrow left column */}
            <div className="lg:col-span-1 space-y-6">
              <Card title="About me" icon={Sparkles}>
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
                <button onClick={() => setEditOpen(true)} className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-ocean hover:text-teal transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit details
                </button>
              </Card>

              <Card title="My vibe" icon={Sparkles} subtitle="Top activities you enjoy">
                {profile?.interests?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(i => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream border border-sand text-xs font-semibold text-charcoal">
                        {i}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-charcoal/40">Add your interests from Edit profile.</p>
                )}
              </Card>

              <Card title="Photos" icon={ImageIcon} action={photoGrid.length > 0 && <span className="text-xs font-semibold text-ocean">View all</span>}>
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

            {/* Wide right column */}
            <div className="lg:col-span-2 space-y-6">
              <Card title={`My communities (${clubs.length})`} icon={Users}
                action={clubs.length > 0 && (
                  <button onClick={() => setActiveTab('Communities')} className="text-xs font-semibold text-ocean hover:text-teal transition-colors flex items-center gap-0.5">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}>
                {clubs.length === 0 ? (
                  <EmptyState text="No communities joined yet." linkTo="/clubs" linkLabel="Browse communities" />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {clubs.slice(0, 3).map(c => (
                      <Link key={c.id} to={`/club/${c.id}`} className="group rounded-xl overflow-hidden border border-sand card-hover">
                        <div className="h-24 overflow-hidden">
                          {c.imageURL
                            ? <img src={c.imageURL} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            : <div className="w-full h-full bg-gradient-to-br from-ocean to-teal" />}
                        </div>
                        <div className="p-2.5 bg-white">
                          <p className="text-xs font-semibold text-charcoal line-clamp-1">{c.name}</p>
                          <p className="text-[11px] text-charcoal/50">{c.memberCount != null ? `${c.memberCount} members` : ''}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Upcoming events" icon={Calendar}
                action={eventsJoinedCount > 0 && (
                  <button onClick={() => setActiveTab('Events')} className="text-xs font-semibold text-ocean hover:text-teal transition-colors flex items-center gap-0.5">
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
                          <p className="text-sm font-semibold text-charcoal group-hover:text-ocean transition-colors line-clamp-1">{e.title}</p>
                          <p className="text-xs text-charcoal/50">{e.date ? moment(e.date).format('ddd, D MMM · HH:mm') : ''}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-teal/10 text-teal text-[11px] font-semibold shrink-0">Going</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Recent activity" icon={ActivityIcon}>
                {activity.length === 0 ? (
                  <EmptyState text="Nothing here yet." />
                ) : (
                  <div className="space-y-4">
                    {activity.slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-ocean/10 flex items-center justify-center shrink-0 mt-0.5">
                          <ActivityIcon className="w-3.5 h-3.5 text-ocean" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-charcoal/80">{describeActivity(item)}</p>
                          <p className="text-xs text-charcoal/40 mt-0.5">
                            {item.createdAt ? moment(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).fromNow() : ''}
                          </p>
                        </div>
                      </div>
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
            {clubs.map(c => (
              <Link key={c.id} to={`/club/${c.id}`} className="bg-white rounded-xl overflow-hidden border border-sand card-hover">
                {c.imageURL
                  ? <img src={c.imageURL} alt={c.name} className="w-full h-32 object-cover" />
                  : <div className="w-full h-32 bg-gradient-to-br from-ocean to-teal" />}
                <div className="p-3">
                  <p className="font-semibold text-sm text-charcoal line-clamp-1">{c.name}</p>
                  <p className="text-xs text-charcoal/50 mt-0.5 capitalize">{c.myRole}</p>
                </div>
              </Link>
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

function Card({ title, icon: Icon, subtitle, action, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-sand shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2">
          <Icon className="w-4 h-4 text-ocean" /> {title}
        </h3>
        {action}
      </div>
      {subtitle && <p className="text-xs text-charcoal/50 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-1" />}
      {children}
    </div>
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

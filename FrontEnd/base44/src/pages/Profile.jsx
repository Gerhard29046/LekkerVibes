import React, { useState, useEffect } from 'react';
import { profileApi } from '@/api/profileApi';
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
  Settings, Briefcase, GraduationCap, Languages, Instagram, Facebook, Link2, ChevronRight, Activity as ActivityIcon,
} from 'lucide-react';
import moment from 'moment';
import ProfileEditor from '@/components/profile/ProfileEditor';

const TABS = ['Overview', 'Communities', 'Events', 'Saved', 'Activity'];

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
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
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
    load().catch(() => setLoading(false));
  }, [user]);

  const handleProfileSaved = (updated) => {
    setProfile(updated);
    setEditOpen(false);
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

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-ocean via-teal to-sky overflow-hidden mt-16">
        {profile?.coverURL && (
          <img src={profile.coverURL} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
        <button
          onClick={() => setEditOpen(true)}
          className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-charcoal/70 backdrop-blur text-white rounded-xl text-sm font-semibold hover:bg-charcoal/90 transition-colors"
        >
          <Edit2 className="w-4 h-4" /> Edit profile
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Avatar + stats */}
        <div className="relative -mt-14 sm:-mt-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-cream overflow-hidden bg-gradient-to-br from-ocean to-teal flex items-center justify-center shadow-lg relative">
            {profile?.photoURL
              ? <img src={profile.photoURL} alt={displayName} className="w-full h-full object-cover" />
              : <span className="text-white font-heading font-bold text-2xl">{initials}</span>
            }
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
            {[
              { label: 'Followers', value: followerCount },
              { label: 'Following', value: followingCount },
              { label: 'Communities', value: clubs.length },
              { label: 'Events joined', value: plans.filter(p => p.type === 'event').length },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl px-3 py-2.5 border border-sand text-center">
                <p className="font-heading font-bold text-charcoal text-lg">{s.value}</p>
                <p className="text-[11px] text-charcoal/50 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Name + bio */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading text-2xl font-bold text-charcoal">{displayName}</h1>
            {profile?.isVerified && <BadgeCheck className="w-5 h-5 text-teal" title="Verified account" />}
            {profile?.photoVerified && <ShieldCheck className="w-5 h-5 text-ocean" title="Photo verified live" />}
          </div>
          {profile?.username && <p className="text-sm text-charcoal/50 mb-2">@{profile.username}</p>}
          {profile?.bio && <p className="text-sm text-charcoal/70 leading-relaxed max-w-xl mb-3">{profile.bio}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-charcoal/60 mb-3">
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
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-sand rounded-xl p-1 mb-6 w-fit overflow-x-auto max-w-full">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/50 hover:text-charcoal'}`}
            >
              {tab}
            </button>
          ))}
          <Link to="/settings" className="px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap text-charcoal/50 hover:text-charcoal transition-all flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> Settings
          </Link>
        </div>

        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-12">
            {/* About me */}
            <div className="bg-white rounded-2xl p-5 border border-sand">
              <h3 className="font-heading font-semibold text-charcoal mb-3">About me</h3>
              {profile?.bio
                ? <p className="text-sm text-charcoal/70 leading-relaxed mb-4">{profile.bio}</p>
                : <p className="text-sm text-charcoal/40 mb-4">No bio yet.</p>}
              <div className="space-y-2 text-sm">
                {profile?.work && (
                  <div className="flex items-center gap-2 text-charcoal/70">
                    <Briefcase className="w-4 h-4 text-charcoal/40" /> {profile.work}
                  </div>
                )}
                {profile?.education && (
                  <div className="flex items-center gap-2 text-charcoal/70">
                    <GraduationCap className="w-4 h-4 text-charcoal/40" /> {profile.education}
                  </div>
                )}
                {profile?.languages?.length > 0 && (
                  <div className="flex items-center gap-2 text-charcoal/70">
                    <Languages className="w-4 h-4 text-charcoal/40" /> {profile.languages.join(', ')}
                  </div>
                )}
              </div>
              {(socialLinks.instagram || socialLinks.facebook || socialLinks.strava || socialLinks.website) && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sand">
                  {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer nofollow" className="text-charcoal/50 hover:text-ocean"><Instagram className="w-5 h-5" /></a>}
                  {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer nofollow" className="text-charcoal/50 hover:text-ocean"><Facebook className="w-5 h-5" /></a>}
                  {socialLinks.website && <a href={socialLinks.website} target="_blank" rel="noopener noreferrer nofollow" className="text-charcoal/50 hover:text-ocean"><Link2 className="w-5 h-5" /></a>}
                </div>
              )}
              <button onClick={() => setEditOpen(true)} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-ocean hover:text-teal transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Edit details
              </button>
            </div>

            {/* My communities */}
            <div className="bg-white rounded-2xl p-5 border border-sand">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-charcoal">My communities ({clubs.length})</h3>
                <button onClick={() => setActiveTab('Communities')} className="text-xs font-medium text-ocean hover:text-teal transition-colors flex items-center gap-0.5">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {clubs.length === 0 ? (
                <p className="text-sm text-charcoal/40">No communities joined yet.</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {clubs.slice(0, 5).map(c => (
                    <Link key={c.id} to={`/club/${c.id}`} className="shrink-0 w-36 bg-cream rounded-xl overflow-hidden border border-sand">
                      {c.imageURL ? <img src={c.imageURL} alt={c.name} className="w-full h-20 object-cover" /> : <div className="w-full h-20 bg-gradient-to-br from-ocean to-teal" />}
                      <div className="p-2">
                        <p className="text-xs font-semibold text-charcoal line-clamp-1">{c.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming events */}
            <div className="bg-white rounded-2xl p-5 border border-sand">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-charcoal">Upcoming events</h3>
                <button onClick={() => setActiveTab('Events')} className="text-xs font-medium text-ocean hover:text-teal transition-colors flex items-center gap-0.5">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {plans.filter(p => p.type === 'event').length === 0 ? (
                <p className="text-sm text-charcoal/40">No upcoming events.</p>
              ) : (
                <div className="space-y-3">
                  {plans.filter(p => p.type === 'event').slice(0, 3).map(e => (
                    <Link key={e.id} to={`/activity/${e.id}`} className="flex items-center gap-3 group">
                      <img src={e.imageURL || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200'} alt={e.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-charcoal group-hover:text-ocean transition-colors line-clamp-1">{e.title}</p>
                        <p className="text-xs text-charcoal/50">{e.date ? moment(e.date).format('ddd, D MMM') : ''}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-2xl p-5 border border-sand">
              <h3 className="font-heading font-semibold text-charcoal mb-3 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-ocean" /> Recent activity
              </h3>
              {activity.length === 0 ? (
                <p className="text-sm text-charcoal/40">Nothing here yet.</p>
              ) : (
                <div className="space-y-3">
                  {activity.slice(0, 4).map(item => (
                    <div key={item.id} className="text-sm">
                      <p className="text-charcoal/80">{describeActivity(item)}</p>
                      <p className="text-xs text-charcoal/40">
                        {item.createdAt ? moment(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).fromNow() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Communities' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {clubs.length === 0 && (
              <div className="col-span-full text-center py-12 text-charcoal/40">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No communities joined yet.</p>
                <Link to="/clubs" className="text-ocean text-sm font-medium mt-2 inline-block">Browse communities →</Link>
              </div>
            )}
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
            {plans.filter(p => p.type === 'event').length === 0 && (
              <div className="col-span-full text-center py-12 text-charcoal/40">
                <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No events joined yet.</p>
                <Link to="/discover" className="text-ocean text-sm font-medium mt-2 inline-block">Discover something →</Link>
              </div>
            )}
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
            {saved.length === 0 && (
              <div className="col-span-full text-center py-12 text-charcoal/40">
                <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nothing saved yet.</p>
                <Link to="/discover" className="text-ocean text-sm font-medium mt-2 inline-block">Discover activities →</Link>
              </div>
            )}
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
          <div className="bg-white rounded-2xl border border-sand divide-y divide-sand mb-12">
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

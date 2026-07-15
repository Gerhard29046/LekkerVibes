import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Camera, Edit2, MapPin, BadgeCheck, Calendar, Users, Star, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import ProfileEditor from '@/components/profile/ProfileEditor';

const INTEREST_EMOJIS = {
  Running: '🏃', Walking: '🚶', Hiking: '🥾', Surfing: '🏄', Cycling: '🚴',
  Eating: '🍽️', Dancing: '💃', Reading: '📚', Gaming: '🎮', Art: '🎨',
  Volunteering: '🤝', Worship: '🙏', Fitness: '💪', Exploring: '🧭', Socialising: '🥂'
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('activities');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
      setProfile(profiles[0] || null);
      const atts = await base44.entities.ActivityAttendance.filter({ user_id: me.id });
      if (atts.length > 0) {
        const actIds = atts.map(a => a.activity_id);
        const acts = await Promise.all(actIds.slice(0, 6).map(id => base44.entities.Activity.get(id).catch(() => null)));
        setActivities(acts.filter(Boolean));
      }
      const memberships = await base44.entities.ClubMember.filter({ user_id: me.id, status: 'active' });
      if (memberships.length > 0) {
        const clubIds = memberships.map(m => m.club_id);
        const clubData = await Promise.all(clubIds.slice(0, 6).map(id => base44.entities.Club.get(id).catch(() => null)));
        setClubs(clubData.filter(Boolean));
      }
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

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

  const displayName = profile?.display_name || user?.full_name || 'Member';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-ocean via-teal to-sky overflow-hidden mt-16">
        {profile?.cover_photo && (
          <img src={profile.cover_photo} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Avatar + actions */}
        <div className="relative -mt-14 sm:-mt-16 flex items-end justify-between mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-cream overflow-hidden bg-gradient-to-br from-ocean to-teal flex items-center justify-center shadow-lg">
            {profile?.profile_photo
              ? <img src={profile.profile_photo} alt={displayName} className="w-full h-full object-cover" />
              : <span className="text-white font-heading font-bold text-2xl">{initials}</span>
            }
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-sand rounded-xl text-sm font-semibold text-charcoal hover:bg-sand transition-colors shadow-sm"
          >
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        </div>

        {/* Name + bio */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading text-2xl font-bold text-charcoal">{displayName}</h1>
            {profile?.is_verified && <BadgeCheck className="w-5 h-5 text-teal" />}
          </div>
          {profile?.username && <p className="text-sm text-charcoal/50 mb-2">@{profile.username}</p>}
          {profile?.bio && <p className="text-sm text-charcoal/70 leading-relaxed max-w-xl mb-3">{profile.bio}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-charcoal/60">
            {profile?.city && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-coral" />{profile.city}</span>
            )}
            {profile?.member_since && (
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-ocean" />Joined {moment(profile.member_since).format('MMM YYYY')}</span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Activities', value: activities.length, icon: Star, color: 'text-coral' },
            { label: 'Clubs', value: clubs.length, icon: Users, color: 'text-teal' },
            { label: 'Interests', value: profile?.interests?.length || 0, icon: Settings, color: 'text-ocean' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-sand text-center">
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
              <p className="font-heading font-bold text-charcoal text-xl">{s.value}</p>
              <p className="text-xs text-charcoal/50">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Interests */}
        {profile?.interests && profile.interests.length > 0 && (
          <div className="mb-8">
            <h3 className="font-heading font-semibold text-charcoal mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(i => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-sand text-sm text-charcoal font-medium">
                  {INTEREST_EMOJIS[i] || '✨'} {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-sand rounded-xl p-1 mb-6 w-fit">
          {['activities', 'clubs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/50 hover:text-charcoal'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'activities' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {activities.length === 0 && (
              <div className="col-span-full text-center py-12 text-charcoal/40">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No activities joined yet.</p>
                <Link to="/discover" className="text-ocean text-sm font-medium mt-2 inline-block">Discover activities →</Link>
              </div>
            )}
            {activities.map(a => (
              <Link key={a.id} to={`/activity/${a.id}`} className="bg-white rounded-xl overflow-hidden border border-sand card-hover">
                <img src={a.cover_image || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400'} alt={a.title} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-semibold text-sm text-charcoal line-clamp-1">{a.title}</p>
                  <p className="text-xs text-charcoal/50 mt-0.5">{moment(a.date).format('D MMM')} · {a.city}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'clubs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {clubs.length === 0 && (
              <div className="col-span-full text-center py-12 text-charcoal/40">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No clubs joined yet.</p>
                <Link to="/clubs" className="text-ocean text-sm font-medium mt-2 inline-block">Browse clubs →</Link>
              </div>
            )}
            {clubs.map(c => (
              <Link key={c.id} to={`/club/${c.id}`} className="bg-white rounded-xl overflow-hidden border border-sand card-hover">
                {c.cover_image
                  ? <img src={c.cover_image} alt={c.name} className="w-full h-32 object-cover" />
                  : <div className="w-full h-32 bg-gradient-to-br from-ocean to-teal" />}
                <div className="p-3">
                  <p className="font-semibold text-sm text-charcoal line-clamp-1">{c.name}</p>
                  <p className="text-xs text-charcoal/50 mt-0.5">{c.member_count || 0} members · {c.city}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {editOpen && (
        <ProfileEditor
          user={user}
          profile={profile}
          onSave={handleProfileSaved}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
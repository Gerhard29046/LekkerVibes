import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { profileApi } from '@/api/profileApi';
import { communitiesApi } from '@/api/communitiesApi';
import { eventsApi } from '@/api/eventsApi';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { MapPin, BadgeCheck, Calendar, Users } from 'lucide-react';
import moment from 'moment';

// Public view of another member's profile. Only the fields the product
// treats as public are rendered here (see profileApi's EDITABLE_FIELDS /
// Firebase/firestore.rules) — email is never shown regardless of what the
// underlying doc contains, since there's no per-field read restriction in
// this pass's rules (documented as a known limitation).
export default function PublicProfile() {
  const { uid } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      profileApi.get(uid),
      communitiesApi.myMemberships(uid).catch(() => []),
      eventsApi.byOrganiser(uid).catch(() => []),
    ]).then(([profileData, memberships, organisedEvents]) => {
      setProfile(profileData);
      setClubs(memberships);
      setUpcomingEvents(organisedEvents);
    }).finally(() => setLoading(false));
  }, [uid]);

  if (user?.uid === uid) {
    return <Navigate to="/profile" replace />;
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
          <h2 className="font-heading text-2xl font-bold text-charcoal mb-2">Member not found</h2>
          <Link to="/" className="text-ocean text-sm font-medium">Back home</Link>
        </div>
      </div>
    );
  }

  const displayName = profile.displayName || 'Member';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="relative h-40 sm:h-56 bg-gradient-to-r from-ocean via-teal to-sky overflow-hidden mt-16">
        {profile.coverURL && <img src={profile.coverURL} alt="Cover" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-12 sm:-mt-14 mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-cream overflow-hidden bg-gradient-to-br from-ocean to-teal flex items-center justify-center shadow-lg">
            {profile.photoURL
              ? <img src={profile.photoURL} alt={displayName} className="w-full h-full object-cover" />
              : <span className="text-white font-heading font-bold text-xl">{initials}</span>
            }
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading text-2xl font-bold text-charcoal">{displayName}</h1>
            {profile.isVerified && <BadgeCheck className="w-5 h-5 text-teal" />}
          </div>
          {profile.bio && <p className="text-sm text-charcoal/70 leading-relaxed max-w-xl mb-3">{profile.bio}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-charcoal/60">
            {profile.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-coral" />{profile.city}</span>}
            {profile.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-ocean" />
                Member since {moment(profile.createdAt.toDate ? profile.createdAt.toDate() : profile.createdAt).format('MMM YYYY')}
              </span>
            )}
          </div>
        </div>

        {profile.interests?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-heading font-semibold text-charcoal mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(i => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-sand text-sm text-charcoal font-medium">
                  ✨ {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {clubs.length > 0 && (
          <div className="mb-8">
            <h3 className="font-heading font-semibold text-charcoal mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal" /> Communities
            </h3>
            <div className="flex flex-wrap gap-2">
              {clubs.map(c => (
                <Link key={c.id} to={`/club/${c.id}`} className="px-3 py-1.5 rounded-full bg-white border border-sand text-sm text-charcoal hover:border-ocean/30 transition-colors">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className="mb-12">
            <h3 className="font-heading font-semibold text-charcoal mb-3 flex items-center gap-2">
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
    </div>
  );
}

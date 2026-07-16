import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { communitiesApi } from '@/api/communitiesApi';
import { eventsApi } from '@/api/eventsApi';
import { reportsApi } from '@/api/reportsApi';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import ActivityCard from '@/components/landing/ActivityCard';
import {
  ArrowLeft, MapPin, Users, Calendar, MessageCircle,
  Shield, Share2, Flag, Loader2, Pencil
} from 'lucide-react';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [club, setClub] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [reported, setReported] = useState(false);

  const load = () => {
    communitiesApi.get(id, user?.uid)
      .then(clubData => {
        setClub(clubData);
        return clubData ? eventsApi.list({ communityId: id }) : [];
      })
      .then(result => setActivities(result || []))
      .catch(() => setClub(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!FEATURES.communities) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.uid]);

  if (!FEATURES.communities) {
    return <ComingSoon feature="Communities" />;
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

  if (!club) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-20 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="font-heading text-2xl font-bold text-charcoal mb-2">Community not found</h2>
          <Link to="/clubs" className="text-ocean text-sm font-medium">Back to communities</Link>
        </div>
      </div>
    );
  }

  const isMember = !!club.myMembership;
  const isOwnerOrOrganiser = club.myMembership?.role === 'organiser' || club.ownerId === user?.uid;

  const handleJoin = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setJoinLoading(true);
    try {
      await communitiesApi.join(club.id, user);
      load();
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    setJoinLoading(true);
    try {
      await communitiesApi.leave(club.id, user.uid);
      load();
    } finally {
      setJoinLoading(false);
    }
  };

  const handleReport = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await reportsApi.create({ reportableType: 'community', reportableId: club.id, reason: 'other', details: undefined }, user);
    setReported(true);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Cover */}
      <div className="relative h-[35vh] sm:h-[45vh] overflow-hidden">
        <img
          src={club.imageURL || 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1600'}
          alt={club.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />

        <div className="absolute top-20 left-4 sm:left-6 flex items-center gap-2">
          <Link
            to="/clubs"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full glass-dark text-white text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Communities
          </Link>
          {isOwnerOrOrganiser && (
            <Link
              to={`/club/${club.id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full glass-dark text-white text-sm font-medium"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
          )}
        </div>

        <div className="absolute bottom-6 left-4 sm:left-6 right-4 sm:right-6">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
            {club.name}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="flex gap-4">
              <div className="bg-white rounded-xl px-5 py-3 border border-sand flex items-center gap-2">
                <Users className="w-4 h-4 text-ocean" />
                <span className="text-sm font-semibold text-charcoal">{club.memberCount} members</span>
              </div>
              {club.city && (
                <div className="bg-white rounded-xl px-5 py-3 border border-sand flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-coral" />
                  <span className="text-sm font-semibold text-charcoal">{club.city}</span>
                </div>
              )}
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl p-6 border border-sand">
              <h2 className="font-heading text-lg font-semibold text-charcoal mb-4">About</h2>
              <p className="text-sm text-charcoal/70 leading-relaxed whitespace-pre-wrap">{club.description}</p>
            </div>

            {/* Guidelines */}
            {club.rules && (
              <div className="bg-white rounded-2xl p-6 border border-sand">
                <h3 className="font-heading text-base font-semibold text-charcoal mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-ocean" />
                  Community Guidelines
                </h3>
                <p className="text-sm text-charcoal/70 leading-relaxed whitespace-pre-wrap">{club.rules}</p>
              </div>
            )}

            {/* Activities */}
            {activities.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-ocean" />
                  Upcoming Activities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activities.map(a => (
                    <ActivityCard key={a.id} activity={a} compact />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-sand sticky top-24">
              <button
                onClick={isMember ? handleLeave : handleJoin}
                disabled={joinLoading}
                className={`w-full py-3 font-semibold rounded-xl transition-all mb-3 text-sm disabled:opacity-60 ${
                  isMember
                    ? 'bg-sand text-charcoal hover:bg-sand/80'
                    : 'bg-gradient-to-r from-ocean to-teal text-white hover:shadow-lg hover:shadow-ocean/20'
                }`}
              >
                {joinLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : isMember ? 'Leave Community' : 'Join Community'}
              </button>
              {isMember && (
                <Link to={`/chat/${club.id}`} className="w-full py-3 bg-ocean/10 text-ocean font-semibold rounded-xl hover:bg-ocean/20 transition-colors text-sm mb-4 flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Group Chat
                </Link>
              )}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  onClick={handleReport}
                  disabled={reported}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal disabled:opacity-60"
                >
                  <Flag className="w-3.5 h-3.5" /> {reported ? 'Reported' : 'Report'}
                </button>
              </div>
            </div>

            {/* Organiser */}
            <div className="bg-white rounded-2xl p-5 border border-sand">
              <h3 className="font-heading text-sm font-semibold text-charcoal mb-3">Organised by</h3>
              <Link to={`/u/${club.ownerId}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center text-white font-bold text-sm">
                  {(club.ownerName || 'O')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal group-hover:text-ocean transition-colors">{club.ownerName}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

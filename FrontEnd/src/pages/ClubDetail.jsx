import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import ActivityCard from '@/components/landing/ActivityCard';
import {
  ArrowLeft, BadgeCheck, MapPin, Users, Calendar, MessageCircle,
  Shield, Share2, Flag
} from 'lucide-react';

export default function ClubDetail() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Club.get(id),
      base44.entities.Activity.filter({ club_name: '' }, '-date', 10).catch(() => [])
    ]).then(([clubData, acts]) => {
      setClub(clubData);
      // Filter activities by club name
      if (clubData) {
        base44.entities.Activity.filter({ club_name: clubData.name, status: 'published' }, '-date', 10)
          .then(setActivities)
          .catch(() => setActivities([]));
      }
    }).catch(() => setClub(null))
      .finally(() => setLoading(false));
  }, [id]);

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

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Cover */}
      <div className="relative h-[35vh] sm:h-[45vh] overflow-hidden">
        <img
          src={club.cover_image || 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1600'}
          alt={club.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />

        <div className="absolute top-20 left-4 sm:left-6">
          <Link
            to="/clubs"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full glass-dark text-white text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Communities
          </Link>
        </div>

        <div className="absolute bottom-6 left-4 sm:left-6 right-4 sm:right-6">
          <div className="flex items-center gap-2 mb-2">
            {club.categories?.map(cat => (
              <span key={cat} className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-medium">
                {cat}
              </span>
            ))}
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
            {club.name}
            {club.is_verified && <BadgeCheck className="w-6 h-6 text-sky" />}
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
                <span className="text-sm font-semibold text-charcoal">{club.member_count} members</span>
              </div>
              <div className="bg-white rounded-xl px-5 py-3 border border-sand flex items-center gap-2">
                <MapPin className="w-4 h-4 text-coral" />
                <span className="text-sm font-semibold text-charcoal">{club.neighbourhood || club.city}</span>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl p-6 border border-sand">
              <h2 className="font-heading text-lg font-semibold text-charcoal mb-4">About</h2>
              <p className="text-sm text-charcoal/70 leading-relaxed">{club.description}</p>
            </div>

            {/* Guidelines */}
            {club.guidelines && (
              <div className="bg-white rounded-2xl p-6 border border-sand">
                <h3 className="font-heading text-base font-semibold text-charcoal mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-ocean" />
                  Community Guidelines
                </h3>
                <p className="text-sm text-charcoal/70 leading-relaxed">{club.guidelines}</p>
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
              <button className="w-full py-3 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/20 transition-all mb-3 text-sm">
                Join Community
              </button>
              <Link to={`/chat/club/${club.id}`} className="w-full py-3 bg-ocean/10 text-ocean font-semibold rounded-xl hover:bg-ocean/20 transition-colors text-sm mb-4 flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Group Chat
              </Link>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal">
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              </div>
            </div>

            {/* Organiser */}
            <div className="bg-white rounded-2xl p-5 border border-sand">
              <h3 className="font-heading text-sm font-semibold text-charcoal mb-3">Organised by</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center text-white font-bold text-sm">
                  {(club.organiser_name || 'O')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal">{club.organiser_name}</p>
                  <p className="text-xs text-charcoal/50 capitalize">{club.membership_type} membership</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
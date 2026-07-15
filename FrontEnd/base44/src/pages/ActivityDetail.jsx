import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import {
  MapPin, Clock, Calendar, Users, Heart, Share2, Bookmark, BadgeCheck,
  ArrowLeft, Star, Sparkles, Shield, Car, Accessibility, AlertTriangle,
  MessageCircle, Flag, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';

export default function ActivityDetail() {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Activity.get(id)
      .then(setActivity)
      .catch(() => setActivity(null))
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

  const dateFormatted = moment(activity.date).format('dddd, D MMMM YYYY');
  const isFree = activity.is_free || activity.price === 0;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero image */}
      <div className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
        <img
          src={activity.cover_image || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600'}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />

        <div className="absolute top-20 left-4 sm:left-6">
          <Link
            to="/discover"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full glass-dark text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="absolute bottom-6 left-4 sm:left-6 right-4 sm:right-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-medium">
              {activity.category || 'Activity'}
            </span>
            {isFree && (
              <span className="px-3 py-1 rounded-full bg-leaf/80 text-white text-xs font-semibold">Free</span>
            )}
            {activity.is_recurring && (
              <span className="px-3 py-1 rounded-full bg-sky/80 text-ocean text-xs font-semibold">Recurring</span>
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
                <p className="text-sm font-semibold text-charcoal">{moment(activity.date).format('D MMM')}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand">
                <Clock className="w-5 h-5 text-teal mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Time</p>
                <p className="text-sm font-semibold text-charcoal">{activity.start_time}{activity.end_time ? ` - ${activity.end_time}` : ''}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand">
                <MapPin className="w-5 h-5 text-coral mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Location</p>
                <p className="text-sm font-semibold text-charcoal truncate">{activity.venue_name || activity.city}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sand">
                <Users className="w-5 h-5 text-leaf mb-2" />
                <p className="text-xs text-charcoal/50 mb-0.5">Going</p>
                <p className="text-sm font-semibold text-charcoal">{activity.attendee_count || 0}{activity.capacity ? ` / ${activity.capacity}` : ''}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-sand">
              <h2 className="font-heading text-lg font-semibold text-charcoal mb-4">About this activity</h2>
              <p className="text-sm text-charcoal/70 leading-relaxed whitespace-pre-wrap">{activity.description}</p>
            </div>

            {/* Welcome labels */}
            {activity.welcome_labels && activity.welcome_labels.length > 0 && (
              <div className="bg-gradient-to-r from-teal/5 to-sky/5 rounded-2xl p-6 border border-teal/10">
                <h3 className="font-heading text-base font-semibold text-charcoal mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-coral" />
                  Why people love this
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activity.welcome_labels.map(label => (
                    <span key={label} className="px-3 py-1.5 rounded-full bg-white border border-teal/20 text-teal text-xs font-medium">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="bg-white rounded-2xl p-6 border border-sand">
              <h3 className="font-heading text-base font-semibold text-charcoal mb-4">Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activity.experience_level && (
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-ocean mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-charcoal/50">Experience level</p>
                      <p className="text-sm font-medium text-charcoal capitalize">{activity.experience_level.replace('_', ' ')}</p>
                    </div>
                  </div>
                )}
                {activity.intensity && (
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-coral mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-charcoal/50">Intensity</p>
                      <p className="text-sm font-medium text-charcoal capitalize">{activity.intensity}</p>
                    </div>
                  </div>
                )}
                {activity.what_to_bring && (
                  <div className="flex items-start gap-3 col-span-full">
                    <Shield className="w-4 h-4 text-teal mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-charcoal/50">What to bring</p>
                      <p className="text-sm font-medium text-charcoal">{activity.what_to_bring}</p>
                    </div>
                  </div>
                )}
                {activity.meeting_instructions && (
                  <div className="flex items-start gap-3 col-span-full">
                    <MapPin className="w-4 h-4 text-coral mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-charcoal/50">Meeting point</p>
                      <p className="text-sm font-medium text-charcoal">{activity.meeting_instructions}</p>
                    </div>
                  </div>
                )}
                {activity.parking_info && (
                  <div className="flex items-start gap-3">
                    <Car className="w-4 h-4 text-charcoal/50 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-charcoal/50">Parking</p>
                      <p className="text-sm font-medium text-charcoal">{activity.parking_info}</p>
                    </div>
                  </div>
                )}
                {activity.accessibility_info && (
                  <div className="flex items-start gap-3">
                    <Accessibility className="w-4 h-4 text-charcoal/50 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-charcoal/50">Accessibility</p>
                      <p className="text-sm font-medium text-charcoal">{activity.accessibility_info}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
              <div className="mb-5">
                <p className="text-2xl font-bold text-charcoal font-heading">
                  {isFree ? 'Free' : `R${activity.price}`}
                </p>
                <p className="text-xs text-charcoal/50">{dateFormatted}</p>
              </div>

              {activity.spots_remaining !== undefined && activity.spots_remaining !== null && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-charcoal/60 mb-1.5">
                    <span>{activity.spots_remaining} spots remaining</span>
                    <span>{activity.attendee_count}/{activity.capacity}</span>
                  </div>
                  <div className="h-2 bg-sand rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ocean to-teal rounded-full"
                      style={{ width: `${((activity.attendee_count || 0) / (activity.capacity || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button className="w-full py-3 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/20 transition-all mb-3 text-sm">
                Join Activity
              </button>
              <button className="w-full py-3 bg-coral/10 text-coral font-semibold rounded-xl hover:bg-coral/20 transition-colors text-sm mb-4">
                I'm Interested
              </button>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal hover:bg-sand/80 transition-colors">
                  <Bookmark className="w-3.5 h-3.5" /> Save
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal hover:bg-sand/80 transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-sand rounded-xl text-xs font-medium text-charcoal hover:bg-sand/80 transition-colors">
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              </div>
            </div>

            {/* Organiser */}
            <div className="bg-white rounded-2xl p-5 border border-sand">
              <h3 className="font-heading text-sm font-semibold text-charcoal mb-3">Organised by</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center text-white font-bold text-sm">
                  {(activity.organiser_name || 'O')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal flex items-center gap-1">
                    {activity.organiser_name}
                    {activity.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-teal" />}
                  </p>
                  {activity.club_name && (
                    <p className="text-xs text-charcoal/50">{activity.club_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Group chat CTA */}
            <div className="bg-gradient-to-br from-ocean/5 to-teal/5 rounded-2xl p-5 border border-ocean/10">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-ocean" />
                <h3 className="font-heading text-sm font-semibold text-charcoal">Group Chat</h3>
              </div>
              <p className="text-xs text-charcoal/60 mb-3">
                Join the group conversation, ask questions, and connect with other attendees.
              </p>
              <Link to={`/chat/activity/${activity.id}`} className="block w-full py-2.5 bg-ocean text-white text-xs font-semibold rounded-xl hover:bg-ocean/90 transition-colors text-center">
                Join Group Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
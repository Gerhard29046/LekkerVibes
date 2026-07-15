import React from 'react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Shield, Users, MapPin, Eye, AlertTriangle, Heart, MessageCircle, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

const TIPS = [
  { icon: MapPin, title: 'Meet in public places', desc: 'Attend first-time meetups in well-lit, populated public areas.' },
  { icon: Users, title: 'Tell someone', desc: 'Let a friend or family member know where you are going and who you are meeting.' },
  { icon: MessageCircle, title: 'Keep chats in the group', desc: 'Keep initial communication inside the LekkerVibes group conversation.' },
  { icon: Eye, title: 'Trust your instincts', desc: 'If something feels wrong, leave. Your safety is more important than being polite.' },
  { icon: Flag, title: 'Report concerns', desc: 'Report any behaviour that makes you uncomfortable. We take every report seriously.' },
  { icon: Heart, title: 'Look out for each other', desc: "Community safety is everyone\u2019s responsibility. Support and watch out for fellow members." },
];

export default function Safety() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ocean/10 text-ocean text-sm font-semibold mb-4"
          >
            <Shield className="w-4 h-4" />
            Your safety matters
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl sm:text-4xl font-bold text-charcoal mb-4"
          >
            Safety at LekkerVibes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-charcoal/60 max-w-lg mx-auto"
          >
            LekkerVibes is built around public group activities. Your safety is at the heart of everything we do.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-ocean to-teal rounded-2xl p-6 sm:p-8 text-white mb-10"
        >
          <h2 className="font-heading text-xl font-semibold mb-2">No private messaging</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            LekkerVibes does not allow private one-to-one messaging between users.
            All communication happens inside group conversations where it remains visible to organisers and moderators.
            This is an important safety feature designed to protect our community.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {TIPS.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-sand"
              >
                <Icon className="w-5 h-5 text-ocean mb-3" />
                <h3 className="font-heading text-sm font-semibold text-charcoal mb-1">{tip.title}</h3>
                <p className="text-xs text-charcoal/60 leading-relaxed">{tip.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sand mb-10">
          <h2 className="font-heading text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-coral" />
            How we moderate
          </h2>
          <div className="space-y-3 text-sm text-charcoal/70">
            <p>Organisers and moderators can remove inappropriate messages and mute or remove members.</p>
            <p>Automated warnings detect phone numbers, personal addresses, inappropriate language, suspicious links, harassment and spam.</p>
            <p>Every user, message, event and organiser can be reported for review.</p>
            <p>Organisers are verified to ensure accountability and trust.</p>
            <p>All group chats have community guidelines that members must follow.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
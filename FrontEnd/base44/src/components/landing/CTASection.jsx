import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

export default function CTASection() {
  const reduceMotion = useReducedMotionPreference();

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="cta-card relative rounded-3xl p-8 sm:p-14 md:p-20 text-center overflow-hidden">
          {/* Ambient glows: teal on the right, coral toward the lower-left —
              the section's one warm decorative accent. Very slow, low-
              opacity drift; static (no motion) when reduced motion applies. */}
          <motion.div
            className="absolute top-[-12%] right-[-10%] w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(125,211,252,0.20), transparent 70%)', filter: 'blur(6px)' }}
            animate={reduceMotion ? undefined : { x: [0, 26, 0], y: [0, -22, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute bottom-[-14%] left-[-10%] w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(249,115,102,0.18), transparent 70%)', filter: 'blur(6px)' }}
            animate={reduceMotion ? undefined : { x: [0, -24, 0], y: [0, 28, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral/15 border border-coral/30 text-coral text-sm mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Join the community
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-body text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
            >
              Ready to find your vibe?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-body text-[#C8D5DA] text-base sm:text-lg max-w-lg mx-auto mb-8"
            >
              Thousands of people are already discovering activities, communities and friendships near them.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                to="/register"
                className="cta-btn-primary flex items-center gap-2 px-8 py-3.5 text-white font-semibold rounded-full text-sm"
              >
                Join LekkerVibes
                <ArrowRight className="cta-arrow w-4 h-4" />
              </Link>
              <Link
                to="/discover"
                className="cta-btn-secondary flex items-center gap-2 px-8 py-3.5 font-semibold rounded-full text-sm"
              >
                Explore first
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

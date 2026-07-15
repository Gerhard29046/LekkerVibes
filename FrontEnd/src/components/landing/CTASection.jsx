import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-gradient-to-br from-ocean via-ocean to-teal rounded-3xl p-8 sm:p-14 md:p-20 text-center overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-sky/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-coral/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal/20 blur-3xl" />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-sm mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Join the community
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
            >
              Ready to find your vibe?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/70 text-base sm:text-lg max-w-lg mx-auto mb-8"
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
                className="flex items-center gap-2 px-8 py-3.5 bg-white text-ocean font-semibold rounded-full hover:shadow-xl hover:shadow-white/20 transition-all text-sm"
              >
                Join LekkerVibes
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/discover"
                className="flex items-center gap-2 px-8 py-3.5 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all text-sm"
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
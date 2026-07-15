import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ocean to-teal flex items-center justify-center">
                <span className="text-white font-heading font-bold text-sm">LV</span>
              </div>
              <span className="font-heading font-bold text-lg text-white">LekkerVibes</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Find your people. Find your place. Find your vibe.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-4">Discover</h4>
            <div className="space-y-2.5">
              <Link to="/discover" className="block text-sm hover:text-white transition-colors">Activities</Link>
              <Link to="/clubs" className="block text-sm hover:text-white transition-colors">Communities</Link>
              <Link to="/cities" className="block text-sm hover:text-white transition-colors">Cities</Link>
              <Link to="/discover" className="block text-sm hover:text-white transition-colors">Trending</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-4">Company</h4>
            <div className="space-y-2.5">
              <Link to="/about" className="block text-sm hover:text-white transition-colors">About</Link>
              <Link to="/safety" className="block text-sm hover:text-white transition-colors">Safety</Link>
              <Link to="/guidelines" className="block text-sm hover:text-white transition-colors">Guidelines</Link>
              <Link to="/contact" className="block text-sm hover:text-white transition-colors">Contact</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white text-sm mb-4">Legal</h4>
            <div className="space-y-2.5">
              <Link to="/privacy" className="block text-sm hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="block text-sm hover:text-white transition-colors">Terms</Link>
              <Link to="/cookies" className="block text-sm hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} LekkerVibes. All rights reserved.
          </p>
          <p className="text-xs text-white/40 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-coral" /> in South Africa
            <MapPin className="w-3 h-3 ml-1" />
          </p>
        </div>
      </div>
    </footer>
  );
}
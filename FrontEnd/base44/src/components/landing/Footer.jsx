import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, ArrowRight } from 'lucide-react';

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="footer-link flex items-center gap-1 text-sm text-[#AFC0C7]">
      {children}
      <ArrowRight className="footer-link-arrow w-3 h-3" />
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-charcoal text-[#AFC0C7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand — logo wordmark keeps the serif font-heading, matching
              the navbar's deliberate brand treatment; everything else in
              this footer uses font-body like the rest of the site. */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ocean to-teal flex items-center justify-center">
                <span className="text-white font-heading font-bold text-sm">LV</span>
              </div>
              <span className="font-heading font-bold text-lg text-white">LekkerVibes</span>
            </div>
            <p className="font-body text-sm text-[#AFC0C7] leading-relaxed">
              Find your people. Find your place. Find your vibe.
            </p>
          </div>

          <div>
            <h4 className="font-body font-semibold text-[#F8FAFC] text-sm mb-4">Discover</h4>
            <div className="space-y-2.5">
              <FooterLink to="/discover">Activities</FooterLink>
              <FooterLink to="/clubs">Communities</FooterLink>
              <FooterLink to="/cities">Cities</FooterLink>
              <FooterLink to="/discover">Trending</FooterLink>
            </div>
          </div>

          <div>
            <h4 className="font-body font-semibold text-[#F8FAFC] text-sm mb-4">Company</h4>
            <div className="space-y-2.5">
              <FooterLink to="/about">About</FooterLink>
              <FooterLink to="/safety">Safety</FooterLink>
              <FooterLink to="/guidelines">Guidelines</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </div>
          </div>

          <div>
            <h4 className="font-body font-semibold text-[#F8FAFC] text-sm mb-4">Legal</h4>
            <div className="space-y-2.5">
              <FooterLink to="/privacy">Privacy</FooterLink>
              <FooterLink to="/terms">Terms</FooterLink>
              <FooterLink to="/cookies">Cookies</FooterLink>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-[#AFC0C7]/80">
            © {new Date().getFullYear()} LekkerVibes. All rights reserved.
          </p>
          <p className="font-body text-xs text-[#AFC0C7]/80 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-coral" /> in South Africa
            <MapPin className="w-3 h-3 ml-1" />
          </p>
        </div>
      </div>
    </footer>
  );
}

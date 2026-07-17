import React, { useState, useCallback, useEffect } from 'react';
import { Link, useLocation as useRouterLocation } from 'react-router-dom';
import { MapPin, Menu, X, ChevronDown, User, Plus } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation.jsx';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FEATURES } from '@/lib/featureFlags';
import NotificationsBell from './NotificationsBell';
import MessagesDropdown from './MessagesDropdown';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { user } = useAuth();
  const { selectedCity, setSelectedCity, cities } = useLocation();
  const { pathname } = useRouterLocation();
  const closeCity = useCallback(() => setCityOpen(false), []);
  const cityRef = useClickOutside(cityOpen, closeCity);

  // Never leave the dropdown open across a navigation.
  useEffect(() => { setCityOpen(false); }, [pathname]);

  const navLinks = [
    { label: 'Home', to: '/' },
    FEATURES.discover && { label: 'Discover', to: '/discover' },
    FEATURES.communities && { label: 'Communities', to: '/clubs' },
    { label: 'Safety', to: '/safety' },
  ].filter(Boolean);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ocean to-teal flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">LV</span>
            </div>
            <span className="font-heading font-bold text-lg text-ocean hidden sm:block">LekkerVibes</span>
          </Link>

          {/* City selector */}
          <div ref={cityRef} className="relative hidden md:block">
            <button
              onClick={() => setCityOpen(!cityOpen)}
              aria-haspopup="listbox"
              aria-expanded={cityOpen}
              className="flex items-center gap-1.5 text-sm font-medium text-charcoal/70 hover:text-ocean transition-colors px-3 py-1.5 rounded-full hover:bg-ocean/5"
            >
              <MapPin className="w-3.5 h-3.5 text-coral" />
              {selectedCity}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {cityOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  role="listbox"
                  className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-sand p-2 min-w-[180px] max-h-[60vh] overflow-y-auto z-[60]"
                >
                  {cities.map(city => (
                    <button
                      key={city}
                      role="option"
                      aria-selected={selectedCity === city}
                      onClick={() => { setSelectedCity(city); setCityOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCity === city ? 'bg-ocean/10 text-ocean font-medium' : 'hover:bg-sand text-charcoal'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-sm font-medium text-charcoal/70 hover:text-ocean transition-colors rounded-lg hover:bg-ocean/5"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Create dropdown */}
                {(FEATURES.events || FEATURES.communities) && (
                  <div className="relative">
                    <button onClick={() => setCreateOpen(!createOpen)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-ocean/10 text-ocean text-sm font-semibold rounded-full hover:bg-ocean/20 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Create
                    </button>
                    <AnimatePresence>
                      {createOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-xl border border-sand p-2 min-w-[170px]"
                        >
                          {FEATURES.events && (
                            <Link to="/create-activity" onClick={() => setCreateOpen(false)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-charcoal hover:bg-sand transition-colors font-medium">
                              <Plus className="w-4 h-4 text-coral" /> New Activity
                            </Link>
                          )}
                          {FEATURES.communities && (
                            <Link to="/create-club" onClick={() => setCreateOpen(false)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-charcoal hover:bg-sand transition-colors font-medium">
                              <Plus className="w-4 h-4 text-teal" /> New Group
                            </Link>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <MessagesDropdown />
                <NotificationsBell />
                <Link to="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center text-white font-bold text-sm hover:shadow-md transition-all">
                  {user.displayName ? user.displayName[0].toUpperCase() : <User className="w-4 h-4" />}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-charcoal/70 hover:text-ocean transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="px-5 py-2 bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-ocean/20 transition-all">
                  Join LekkerVibes
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-charcoal">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-sand bg-cream overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {/* City selector mobile */}
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-coral font-medium">
                <MapPin className="w-4 h-4" />
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="bg-transparent font-medium text-charcoal"
                >
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:text-ocean rounded-lg hover:bg-ocean/5"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-sand space-y-2">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:text-ocean rounded-lg hover:bg-ocean/5">My Profile</Link>
                    {FEATURES.events && (
                      <Link to="/create-activity" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:text-ocean rounded-lg hover:bg-ocean/5">Create Activity</Link>
                    )}
                    {FEATURES.communities && (
                      <Link to="/create-club" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:text-ocean rounded-lg hover:bg-ocean/5">Create Group</Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-charcoal/70">
                      Log in
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="block text-center px-5 py-3 bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold rounded-full">
                      Join LekkerVibes
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
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
  // One state for every navbar-level dropdown (city, create, messages,
  // notifications) instead of independent booleans — opening any one of
  // them closes whichever other one was open, rather than letting them
  // stack up simultaneously.
  const [openMenu, setOpenMenu] = useState(null); // 'city' | 'create' | 'messages' | 'notifications' | null
  const cityOpen = openMenu === 'city';
  const createOpen = openMenu === 'create';
  const { user } = useAuth();
  const { selectedCity, setSelectedCity, cities } = useLocation();
  const { pathname, search } = useRouterLocation();
  const closeCity = useCallback(() => setOpenMenu((cur) => (cur === 'city' ? null : cur)), []);
  const closeCreate = useCallback(() => setOpenMenu((cur) => (cur === 'create' ? null : cur)), []);
  const cityRef = useClickOutside(cityOpen, closeCity);
  const createRef = useClickOutside(createOpen, closeCreate);

  // Never leave a navbar dropdown open across a navigation.
  useEffect(() => { setOpenMenu(null); setMobileOpen(false); }, [pathname, search]);

  const navLinks = [
    { label: 'Home', to: '/' },
    FEATURES.discover && { label: 'Discover', to: '/discover' },
    FEATURES.communities && { label: 'Communities', to: '/clubs' },
    FEATURES.messages && { label: 'Messages', to: '/messages' },
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
              onClick={() => setOpenMenu((cur) => (cur === 'city' ? null : 'city'))}
              aria-haspopup="listbox"
              aria-expanded={cityOpen}
              aria-controls="navbar-city-listbox"
              className="flex items-center gap-1.5 text-sm font-medium text-charcoal/70 hover:text-ocean transition-colors px-3 py-1.5 rounded-full hover:bg-ocean/5"
            >
              <MapPin className="w-3.5 h-3.5 text-coral" />
              {selectedCity}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {cityOpen && (
                <motion.div
                  id="navbar-city-listbox"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  role="listbox"
                  className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[180px] max-h-80 overflow-y-auto rounded-xl border border-sand bg-white p-2 shadow-2xl"
                >
                  {cities.map(city => (
                    <button
                      key={city}
                      role="option"
                      aria-selected={selectedCity === city}
                      onClick={() => { setSelectedCity(city); setOpenMenu(null); }}
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
                  <div ref={createRef} className="relative">
                    <button
                      onClick={() => setOpenMenu((cur) => (cur === 'create' ? null : 'create'))}
                      aria-haspopup="menu"
                      aria-expanded={createOpen}
                      aria-controls="navbar-create-menu"
                      className="flex items-center gap-1.5 px-4 py-2 bg-ocean/10 text-ocean text-sm font-semibold rounded-full hover:bg-ocean/20 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create
                    </button>
                    <AnimatePresence>
                      {createOpen && (
                        <motion.div
                          id="navbar-create-menu"
                          role="menu"
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.18 }}
                          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[170px] overflow-hidden rounded-xl border border-sand bg-white p-2 shadow-2xl"
                        >
                          {FEATURES.events && (
                            <Link to="/create-activity" role="menuitem" onClick={() => setOpenMenu(null)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-charcoal hover:bg-sand transition-colors font-medium">
                              <Plus className="w-4 h-4 text-coral" /> New Activity
                            </Link>
                          )}
                          {FEATURES.communities && (
                            <Link to="/create-club" role="menuitem" onClick={() => setOpenMenu(null)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-charcoal hover:bg-sand transition-colors font-medium">
                              <Plus className="w-4 h-4 text-teal" /> New Group
                            </Link>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <MessagesDropdown
                  open={openMenu === 'messages'}
                  onOpenChange={(next) => setOpenMenu(next ? 'messages' : null)}
                />
                <NotificationsBell
                  open={openMenu === 'notifications'}
                  onOpenChange={(next) => setOpenMenu(next ? 'notifications' : null)}
                />
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
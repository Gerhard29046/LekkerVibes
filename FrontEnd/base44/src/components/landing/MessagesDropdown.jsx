import React, { useState, useCallback } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { communitiesApi } from '@/api/communitiesApi';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';

// Opens group/community chats only — LekkerVibes has no private
// person-to-person messaging (see Firebase/firestore.rules: conversations
// are always community-scoped or explicit memberIds groups, never a
// per-user DM collection).
export default function MessagesDropdown() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside(open, close);

  const handleToggle = () => {
    setOpen((o) => !o);
    if (!loaded && user) {
      setLoading(true);
      communitiesApi.myMemberships(user.uid).then(setClubs).finally(() => { setLoading(false); setLoaded(true); });
    }
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button onClick={handleToggle} className="p-2 rounded-full hover:bg-ocean/5 transition-colors" aria-label="Group and community chats">
        <MessageCircle className="w-5 h-5 text-charcoal/70" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-0 mt-2 w-72 max-w-[90vw] max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-xl border border-sand z-[60]"
          >
            <div className="px-4 py-3 border-b border-sand">
              <h3 className="font-body font-semibold text-sm text-charcoal">Community chats</h3>
              <p className="text-xs text-charcoal/40 mt-0.5">LekkerVibes chat stays inside your communities — no private messages.</p>
            </div>
            {loading ? (
              <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-charcoal/30" /></div>
            ) : clubs.length === 0 ? (
              <p className="p-6 text-sm text-charcoal/40 text-center">Join a community to start chatting.</p>
            ) : (
              <div className="divide-y divide-sand">
                {clubs.map((c) => (
                  <Link key={c.id} to={`/chat/${c.id}`} onClick={close}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-sand/50 transition-colors">
                    {c.imageURL
                      ? <img src={c.imageURL} alt={c.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean to-teal shrink-0" />}
                    <span className="text-sm font-medium text-charcoal line-clamp-1">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

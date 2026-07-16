import React, { useState, useEffect, useCallback } from 'react';
import { Bell, UserPlus, UserCheck, Link2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { notificationsApi } from '@/api/notificationsApi';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';
import moment from 'moment';

const ICONS = {
  follow_request: UserPlus,
  follow_accepted: UserCheck,
  social_reveal_request: Link2,
  social_access_approved: Link2,
  social_access_revoked: Link2,
};

function describe(n) {
  switch (n.type) {
    case 'follow_request': return 'sent you a follow request';
    case 'follow_accepted': return 'accepted your follow request';
    case 'social_reveal_request': return 'requested your social links';
    case 'social_access_approved': return 'approved your social-link request';
    case 'social_access_revoked': return 'revoked your social-link access';
    default: return 'sent a notification';
  }
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside(open, close);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    notificationsApi.list(user.uid).then(setItems).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { if (open) load(); }, [open, load]);

  if (!user) return null;
  const unreadCount = items.filter((n) => !n.read).length;

  const handleOpenItem = (n) => {
    if (!n.read) notificationsApi.markRead(user.uid, n.id).then(() => setItems((cur) => cur.map((x) => x.id === n.id ? { ...x, read: true } : x)));
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-full hover:bg-ocean/5 transition-colors" aria-label="Notifications">
        <Bell className="w-5 h-5 text-charcoal/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-xl border border-sand z-[60]"
          >
            <div className="px-4 py-3 border-b border-sand">
              <h3 className="font-heading font-semibold text-sm text-charcoal">Notifications</h3>
            </div>
            {loading ? (
              <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-charcoal/30" /></div>
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-charcoal/40 text-center">No notifications yet.</p>
            ) : (
              <div className="divide-y divide-sand">
                {items.map((n) => {
                  const Icon = ICONS[n.type] || Bell;
                  return (
                    <Link
                      key={n.id}
                      to={n.fromUid ? `/u/${n.fromUid}` : '#'}
                      onClick={() => handleOpenItem(n)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-sand/50 transition-colors ${!n.read ? 'bg-ocean/5' : ''}`}
                    >
                      <Icon className="w-4 h-4 text-ocean shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-charcoal">Someone {describe(n)}</p>
                        <p className="text-xs text-charcoal/40 mt-0.5">
                          {n.createdAt ? moment(n.createdAt.toDate ? n.createdAt.toDate() : n.createdAt).fromNow() : ''}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

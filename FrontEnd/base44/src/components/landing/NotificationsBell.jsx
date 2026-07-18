import React, { useState, useEffect, useCallback } from 'react';
import { Bell, UserPlus, UserCheck, Link2, Loader2, Check, X as XIcon, CalendarPlus, CalendarClock, MessageCircle, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { notificationsApi } from '@/api/notificationsApi';
import { followApi } from '@/api/followApi';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';
import moment from 'moment';

const ICONS = {
  follow_request: UserPlus,
  follow_accepted: UserCheck,
  social_reveal_request: Link2,
  social_access_approved: Link2,
  social_access_revoked: Link2,
  event_join: CalendarPlus,
  event_update: CalendarClock,
  group_message: MessageCircle,
};

function describe(n) {
  switch (n.type) {
    case 'follow_request': return 'requested to follow you';
    case 'follow_accepted': return 'accepted your follow request';
    case 'social_reveal_request': return 'requested your social links';
    case 'social_access_approved': return 'approved your social-link request';
    case 'social_access_revoked': return 'revoked your social-link access';
    case 'event_join': return `joined ${n.eventTitle || 'your activity'}`;
    case 'event_update': return `${n.eventTitle || 'An activity you joined'} was cancelled`;
    case 'group_message': return `${n.count > 1 ? `${n.count} new messages` : 'New message'} in ${n.groupName || 'a group chat'}`;
    default: return 'sent a notification';
  }
}

// Where tapping a notification should take you — most point at the actor's
// profile, but chat/event activity should land you on the thing itself.
function targetPath(n) {
  if (n.type === 'group_message') return `/chat/${n.targetId}`;
  if (n.type === 'event_join' || n.type === 'event_update') return `/activity/${n.targetId}`;
  return n.fromUid ? `/u/${n.fromUid}` : '#';
}

function groupByRecency(items) {
  const startOfToday = moment().startOf('day');
  const startOfWeek = moment().subtract(7, 'days');
  const groups = { Today: [], 'This week': [], Earlier: [] };
  for (const n of items) {
    const at = n.createdAt ? moment(n.createdAt.toDate ? n.createdAt.toDate() : n.createdAt) : null;
    if (at && at.isSameOrAfter(startOfToday)) groups.Today.push(n);
    else if (at && at.isSameOrAfter(startOfWeek)) groups['This week'].push(n);
    else groups.Earlier.push(n);
  }
  return Object.entries(groups).filter(([, list]) => list.length > 0);
}

export default function NotificationsBell({ open, onOpenChange }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
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
    close();
  };

  const handleMarkAllRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead(user.uid);
      setItems((cur) => cur.map((x) => ({ ...x, read: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleAccept = async (e, n) => {
    e.preventDefault();
    e.stopPropagation();
    setBusyId(n.id);
    try {
      const requestId = `${n.fromUid}_${user.uid}`;
      await followApi.acceptRequest(requestId);
      await notificationsApi.markRead(user.uid, n.id);
      setItems((cur) => cur.filter((x) => x.id !== n.id));
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (e, n) => {
    e.preventDefault();
    e.stopPropagation();
    setBusyId(n.id);
    try {
      await followApi.declineRequest(n.fromUid, user.uid);
      await notificationsApi.markRead(user.uid, n.id);
      setItems((cur) => cur.filter((x) => x.id !== n.id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="relative p-2 rounded-full hover:bg-ocean/5 transition-colors"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="navbar-notifications-menu"
      >
        <Bell className="w-5 h-5 text-charcoal/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id="navbar-notifications-menu"
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 max-w-[calc(100vw-24px)] max-h-96 overflow-y-auto rounded-xl border border-sand bg-white shadow-2xl"
          >
            <div className="px-4 py-3 border-b border-sand flex items-center justify-between">
              <h3 className="font-body font-semibold text-sm text-charcoal">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xs font-medium text-ocean hover:text-teal transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>
            {loading ? (
              <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-charcoal/30" /></div>
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-charcoal/40 text-center">No notifications yet.</p>
            ) : (
              groupByRecency(items).map(([label, group]) => (
                <div key={label}>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-charcoal/40">{label}</p>
                  <div className="divide-y divide-sand">
                    {group.map((n) => {
                      const Icon = ICONS[n.type] || Bell;
                      return (
                        <Link
                          key={n.id}
                          to={targetPath(n)}
                          role="menuitem"
                          onClick={() => handleOpenItem(n)}
                          className={`block px-4 py-3 hover:bg-sand/50 transition-colors ${!n.read ? 'bg-ocean/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="w-4 h-4 text-ocean shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-charcoal">{n.type === 'group_message' || n.type === 'event_update' ? describe(n) : `Someone ${describe(n)}`}</p>
                              <p className="text-xs text-charcoal/40 mt-0.5">
                                {n.createdAt ? moment(n.createdAt.toDate ? n.createdAt.toDate() : n.createdAt).fromNow() : ''}
                              </p>
                              {n.type === 'follow_request' && (
                                <div className="flex gap-2 mt-2">
                                  <button onClick={(e) => handleAccept(e, n)} disabled={busyId === n.id}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-teal text-white rounded-lg text-xs font-semibold hover:bg-teal/90 transition-colors disabled:opacity-50">
                                    <Check className="w-3 h-3" /> Accept
                                  </button>
                                  <button onClick={(e) => handleDecline(e, n)} disabled={busyId === n.id}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-sand text-charcoal rounded-lg text-xs font-semibold hover:bg-sand/80 transition-colors disabled:opacity-50">
                                    <XIcon className="w-3 h-3" /> Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

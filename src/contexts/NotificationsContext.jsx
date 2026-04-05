import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const appNotifications = useStore((s) => s.appNotifications);
  const fetchAppNotifications = useStore((s) => s.fetchAppNotifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);

  const [open, setOpen] = useState(false);

  const items = useMemo(() => {
    return (appNotifications || []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body || '',
      at: new Date(n.created_at).getTime(),
      read: Boolean(n.read_at),
    }));
  }, [appNotifications]);

  const unreadCount = items.filter((i) => !i.read).length;

  const markRead = useCallback(
    (id) => {
      markNotificationRead(id);
    },
    [markNotificationRead]
  );

  const markAllRead = useCallback(() => {
    markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let channel;
    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchAppNotifications();
          }
        )
        .subscribe();
    };
    setup();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchAppNotifications]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!e.target.closest?.('[data-notifications-root]')) setOpen(false);
    };
    if (open) document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [open]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      open,
      setOpen,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, open, markRead, markAllRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications requiere NotificationsProvider');
  return ctx;
}

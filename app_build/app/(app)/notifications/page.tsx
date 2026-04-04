// @witness [COM-001]
'use client';

import { useState, useEffect, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/notifications?page=${p}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => p === 1 ? data.data : [...prev, ...data.data]);
        setHasMore(data.data.length === 20);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(page); }, [fetchNotifications, page]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH', credentials: 'include' });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const typeIcons: Record<string, string> = {
    HANDSHAKE_REQUEST: '🤝',
    HANDSHAKE_ACCEPT: '✅',
    RFP_RESPONSE: '📨',
    RFP_ACCEPT: '🎉',
    AD_MODERATION: '📢',
    SUBSCRIPTION: '💎',
    SYSTEM: '🔔',
  };

  if (loading && notifications.length === 0) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Your activity updates and alerts</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>Mark All Read</Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-lg font-medium">No notifications yet</p>
          <p className="text-sm mt-1">When someone interacts with you, you&apos;ll see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                n.is_read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{typeIcons[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.is_read && <Badge variant="default" className="text-xs px-1.5 py-0">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage(p => p + 1)}>Load More</Button>
        </div>
      )}
    </div>
  );
}

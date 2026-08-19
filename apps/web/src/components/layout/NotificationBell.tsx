'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';

interface NotificationResponse {
  id: string;
  type: string;
  entityId: string | null;
  message: string | null;
  isRead: boolean;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch initial unread count
    fetchApi<{count: number}>('/notifications/unread-count')
      .then(res => setUnreadCount(res.count))
      .catch(console.error);
      
    // Ideally we would set up an SSE or WebSocket connection here for real-time updates
    const interval = setInterval(() => {
      fetchApi<{count: number}>('/notifications/unread-count')
        .then(res => setUnreadCount(res.count))
        .catch(console.error);
    }, 30000); // poll every 30s as fallback
    
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Fetch notifications when opened
      setLoading(true);
      fetchApi<NotificationResponse[]>('/notifications?limit=10')
        .then(setNotifications)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
      await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // Revert if failed (ignoring for brevity)
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetchApi('/notifications/read-all', { method: 'POST' });
    } catch {
      // Revert if failed
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative p-2 text-content-secondary hover:bg-surface-elevated rounded-full transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-surface-base">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-card border border-border rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-content-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-brand-primary hover:text-brand-secondary font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-content-secondary text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <Bell className="w-10 h-10 text-content-secondary mb-3 opacity-20" />
                <p className="text-content-secondary">No notifications yet</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map(notification => (
                  <Link 
                    key={notification.id}
                    href={
                      notification.type === 'NEW_VIDEO' && notification.entityId ? `/watch/${notification.entityId}` :
                      notification.actor ? `/@${notification.actor.username}` : '#'
                    }
                    onClick={() => {
                      if (!notification.isRead) markAsRead(notification.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-start gap-3 p-4 hover:bg-surface-elevated transition-colors border-b border-border last:border-b-0 ${
                      !notification.isRead ? 'bg-brand-primary/5' : ''
                    }`}
                  >
                    {notification.actor ? (
                      <Avatar src={notification.actor.avatarUrl} alt={notification.actor.displayName} size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-content-secondary" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-content-primary line-clamp-2">
                        {notification.message || 'New notification'}
                      </p>
                      <p className="text-xs text-content-secondary mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    
                    {!notification.isRead && (
                      <button 
                        onClick={(e) => markAsRead(notification.id, e)}
                        className="p-1 hover:bg-surface-base rounded-full text-brand-primary shrink-0"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-border bg-surface-elevated text-center">
            <Link 
              href="/settings/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-sm text-content-secondary hover:text-content-primary font-medium"
            >
              Notification Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

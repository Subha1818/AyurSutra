import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/api';
import { toast } from 'sonner';

export interface NotificationItem {
  id: number | string;
  message: string;
  type: 'reminder' | 'update' | 'alert';
  read: boolean;
  created_at?: string;
}

export function useNotifications(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const items = await notificationService.getNotifications(userId);
      setNotifications(items);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    // Subscribe to Supabase Realtime updates on notifications table for this user
    const channelName = `realtime-notifications-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const newNotif: NotificationItem = {
            id: payload.new.id,
            message: payload.new.message,
            type: payload.new.type || 'reminder',
            read: payload.new.is_read || false,
            created_at: payload.new.created_at,
          };

          setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);

          // Trigger live toast alert for new incoming notification
          if (newNotif.type === 'alert') {
            toast.error(newNotif.message, { description: 'Urgent Alert' });
          } else if (newNotif.type === 'update') {
            toast.info(newNotif.message, { description: 'AyurSutra Update' });
          } else {
            toast.success(newNotif.message, { description: 'Session Reminder' });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          setNotifications(prev =>
            prev.map(n =>
              n.id === payload.new.id
                ? {
                    ...n,
                    read: payload.new.is_read,
                    message: payload.new.message,
                    type: payload.new.type,
                  }
                : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markRead = async (notificationId: number | string) => {
    await notificationService.markRead(notificationId);
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    refreshNotifications: fetchNotifications,
  };
}

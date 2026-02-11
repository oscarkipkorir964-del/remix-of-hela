import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// Notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAEJI4Hp/I1yKAQAJYD4/65sEwAAKnX08bxvAwAANHD58cFiAwAAL3H07spsAwAAOXH477tyAwAAMHH07rp1AwAAJIP9+71qAwAAIon/+sZoAwAAH43/+sxnAwAAI4r/+s5oAwAAJYb+/M1oAwAAI4r/+c1oAwAAIIn/+c1oAwAAH4n++M9oAwAAIIn/+c9nAwAAIYn/+s5mAwAAIon/+s1nAwAAIor/+c9oAwAAIon/+s5nAwAAIon/+85oAwAAIYr++c9oAwAAIon++89oAwAAH4n++89nAwAAIIn++89oAwAAHoj++85oAwAAIIn++89oAwAAIIn++s5oAwAAIIn++s5oAwAAIIn++s1oAwAAIIn++81oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAH4j++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAH4j++c1oAwAAH4j++c1oAwAAH4j++c1oAwAAH4j++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAH4n++c1oAwAAH4n++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAH4n++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwAAIIn++c1oAwA=";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
    }
  }, []);

  const showBrowserNotification = useCallback((title: string, message: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/favicon.png",
        tag: "zenka-notification",
      });
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    requestNotificationPermission();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Check if this notification is for the current user
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && newNotification.user_id === user.id) {
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // Play sound and show browser notification
              playNotificationSound();
              showBrowserNotification(newNotification.title, newNotification.message);
              
              // Also show toast
              toast.info(newNotification.title, {
                description: newNotification.message.substring(0, 100) + (newNotification.message.length > 100 ? '...' : ''),
                duration: 6000,
              });
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, playNotificationSound, showBrowserNotification, requestNotificationPermission]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
    requestNotificationPermission,
  };
};

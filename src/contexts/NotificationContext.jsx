import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToCollection, markNotifRead } from '../api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [dbNotifications, setDbNotifications] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([
    {
      id: 'sys-1',
      title: 'SYSTEM_SYNC_COMPLETE',
      message: 'Neural engine has successfully indexed 14 new event nodes.',
      time: '2m ago',
      read: false,
      type: 'system'
    }
  ]);

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToCollection('notifications', (data) => {
      // Sort and map for UI compatibility
      setDbNotifications(data.map(n => ({
        ...n,
        time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
      })));
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [user]);

  const allNotifications = [...systemNotifications, ...dbNotifications].sort((a, b) => {
    const timeA = a.created_at || a.time || 0;
    const timeB = b.created_at || b.time || 0;
    return new Date(timeB) - new Date(timeA);
  });

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    if (id === 'all') {
      setSystemNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // Bulk update handled by API if needed
    } else if (typeof id === 'string' && id.startsWith('sys-')) {
      setSystemNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } else {
      await markNotifRead(id);
    }
  };

  const addNotification = (notif) => {
    setSystemNotifications(prev => [
      { id: `sys-${Date.now()}`, read: false, time: 'Just now', ...notif },
      ...prev
    ]);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications: allNotifications, 
      unreadCount, 
      markAsRead, 
      addNotification 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

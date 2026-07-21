import { useEffect, useState } from 'react';
import { trackEvent } from '../utils/analytics';

function getInitialStatus() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(getInitialStatus);

  useEffect(() => {
    const updateStatus = (online) => {
      setIsOnline(online);
      trackEvent('connection_status_change', { status: online ? 'online' : 'offline' });
    };
    const handleOnline = () => updateStatus(true);
    const handleOffline = () => updateStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

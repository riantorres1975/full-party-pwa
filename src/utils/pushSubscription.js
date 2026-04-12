import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// DEBUG: read push event logs from IndexedDB (written by SW)
export async function getPushDebugLogs() {
  return new Promise((resolve) => {
    const open = indexedDB.open('push-debug', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('logs', { autoIncrement: true });
    open.onsuccess = () => {
      try {
        const tx = open.result.transaction('logs', 'readonly');
        const req = tx.objectStore('logs').getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve([]);
      } catch { resolve([]); }
    };
    open.onerror = () => resolve([]);
  });
}

// Expose to window for easy mobile debugging
if (typeof window !== 'undefined') {
  window._pushDebugLogs = async () => {
    const logs = await getPushDebugLogs();
    alert('[Push Debug Logs]\n' + (logs.length ? JSON.stringify(logs, null, 2) : 'No push events received by SW'));
    return logs;
  };
}

export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    window.isSecureContext &&
    !!VAPID_PUBLIC_KEY
  );
}

export async function subscribeToPush(folio, telefono) {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  try {
    const registration = await navigator.serviceWorker.ready;

    // Unsubscribe any existing subscription (needed when VAPID keys change)
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const sub = subscription.toJSON();

    const row = {
      folio,
      cliente_telefono: telefono || null,
      endpoint: sub.endpoint,
      keys_p256dh: sub.keys.p256dh,
      keys_auth: sub.keys.auth,
    };

    const { error } = await supabase.from('push_subscriptions').insert(row);

    if (error) {
      if (error.code === '23505') {
        console.info('[Push] Subscription already saved for this endpoint');
      } else {
        console.warn('[Push] Error saving subscription:', error.message);
        return { ok: false, reason: 'db_error' };
      }
    }

    return { ok: true };
  } catch (err) {
    console.warn('[Push] Subscription failed:', err);
    return { ok: false, reason: 'error' };
  }
}

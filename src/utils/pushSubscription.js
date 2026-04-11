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
  // DEBUG: temporary alerts to diagnose mobile issues
  if (!isPushSupported()) {
    alert('[Push DEBUG] Not supported. VAPID key: ' + (VAPID_PUBLIC_KEY ? 'SET' : 'MISSING'));
    return { ok: false, reason: 'unsupported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('[Push DEBUG] Permission denied: ' + permission);
    return { ok: false, reason: 'denied' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Unsubscribe any existing subscription (needed when VAPID keys change)
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
      alert('[Push DEBUG] Old subscription removed');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    alert('[Push DEBUG] Subscribed! Endpoint: ' + subscription.endpoint.slice(0, 60) + '...');

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
        alert('[Push DEBUG] Already saved (duplicate)');
      } else {
        alert('[Push DEBUG] DB Error: ' + error.code + ' ' + error.message);
        return { ok: false, reason: 'db_error' };
      }
    } else {
      alert('[Push DEBUG] Saved to DB! Folio: ' + folio);
    }

    return { ok: true };
  } catch (err) {
    alert('[Push DEBUG] FAILED: ' + err.name + ': ' + err.message);
    return { ok: false, reason: 'error' };
  }
}

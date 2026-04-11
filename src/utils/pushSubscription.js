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

    console.log('[Push] Subscribing with VAPID key:', VAPID_PUBLIC_KEY?.slice(0, 20) + '...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    console.log('[Push] Browser subscription created:', subscription.endpoint);

    const sub = subscription.toJSON();

    const row = {
      folio,
      cliente_telefono: telefono || null,
      endpoint: sub.endpoint,
      keys_p256dh: sub.keys.p256dh,
      keys_auth: sub.keys.auth,
    };

    console.log('[Push] Saving to DB, folio:', folio);
    const { error } = await supabase.from('push_subscriptions').insert(row);

    if (error) {
      if (error.code === '23505') {
        console.info('[Push] Subscription already saved for this endpoint');
      } else {
        console.error('[Push] Error saving subscription:', error.code, error.message, error);
        return { ok: false, reason: 'db_error' };
      }
    } else {
      console.log('[Push] Subscription saved successfully!');
    }

    return { ok: true };
  } catch (err) {
    console.error('[Push] Subscription failed:', err.name, err.message, err);
    return { ok: false, reason: 'error' };
  }
}

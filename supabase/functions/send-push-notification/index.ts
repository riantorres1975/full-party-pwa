// Supabase Edge Function: send-push-notification
// Sends Web Push notifications to customers when order status changes.
// Deploy: supabase functions deploy send-push-notification
// Secrets needed: VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT (mailto:email)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@fullparty.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Notification messages per status ──────────────────────────────────────
interface NotifContent {
  title: string;
  body: string;
}

function getNotificationContent(
  estado: string,
  nombre: string,
  folio: string
): NotifContent {
  switch (estado) {
    case "Armando Pedido":
      return {
        title: "Preparando tu pedido",
        body: `Hola ${nombre}, ya estamos preparando tu pedido ${folio}. Te avisamos cuando esté listo.`,
      };
    case "Listo para Entrega":
      return {
        title: "Tu pedido está listo",
        body: `Hola ${nombre}, tu pedido ${folio} ya está listo para entrega.`,
      };
    case "Cancelado":
      return {
        title: "Pedido cancelado",
        body: `Hola ${nombre}, tu pedido ${folio} ha sido cancelado. Contáctanos si tienes dudas.`,
      };
    default:
      return {
        title: "Actualización de pedido",
        body: `Hola ${nombre}, tu pedido ${folio} tiene una actualización: ${estado}.`,
      };
  }
}

// ── Web Push crypto helpers (RFC 8291 / RFC 8188) ─────────────────────────
function base64UrlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importVapidKey(rawB64: string): Promise<CryptoKey> {
  // Decode the uncompressed public key (65 bytes: 0x04 || x || y)
  const pubBytes = base64UrlDecode(VAPID_PUBLIC_KEY);
  const x = pubBytes.slice(1, 33);
  const y = pubBytes.slice(33, 65);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: rawB64,
    x: base64UrlEncode(x.buffer),
    y: base64UrlEncode(y.buffer),
  };

  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function createJwt(
  endpoint: string,
  vapidSubject: string,
  privateKey: CryptoKey
): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 3600;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp: expiry, sub: vapidSubject };

  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    enc.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  } else {
    // DER encoded
    const rLen = sigBytes[3];
    const rStart = 4;
    const rRaw = sigBytes.slice(rStart, rStart + rLen);
    r = rRaw.length > 32 ? rRaw.slice(rRaw.length - 32) : rRaw;
    const sLenIdx = rStart + rLen + 1;
    const sLen = sigBytes[sLenIdx];
    const sStart = sLenIdx + 1;
    const sRaw = sigBytes.slice(sStart, sStart + sLen);
    s = sRaw.length > 32 ? sRaw.slice(sRaw.length - 32) : sRaw;
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r.length < 32 ? new Uint8Array([...new Array(32 - r.length).fill(0), ...r]) : r, 0);
  rawSig.set(s.length < 32 ? new Uint8Array([...new Array(32 - s.length).fill(0), ...s]) : s, 32);

  return `${unsignedToken}.${base64UrlEncode(rawSig.buffer)}`;
}

async function encryptPayload(
  p256dhB64: string,
  authB64: string,
  payload: Uint8Array
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const clientPublicKeyBytes = base64UrlDecode(p256dhB64);
  const authSecret = base64UrlDecode(authB64);

  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPublicKey },
    localKeyPair.privateKey,
    256
  );

  const localPublicKeyRaw = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);

  // HKDF-based key derivation (RFC 8291)
  const authInfo = new Uint8Array([
    ...new TextEncoder().encode("WebPush: info\0"),
    ...clientPublicKeyBytes,
    ...localPublicKey,
  ]);

  const authHkdfKey = await crypto.subtle.importKey("raw", authSecret, { name: "HKDF" }, false, ["deriveBits"]);
  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(sharedSecret), info: authInfo },
      authHkdfKey,
      256
    )
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const ikmKey = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
  const prk = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("Content-Encoding: aes128gcm\0") },
      ikmKey,
      128
    )
  );

  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
      ikmKey,
      96
    )
  );

  const contentKey = await crypto.subtle.importKey("raw", prk, { name: "AES-GCM" }, false, ["encrypt"]);

  // Pad payload with delimiter
  const padded = new Uint8Array(payload.length + 1);
  padded.set(payload);
  padded[payload.length] = 2; // padding delimiter

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, contentKey, padded)
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = new DataView(new ArrayBuffer(4));
  rs.setUint32(0, payload.length + 1 + 16 + 1); // record size

  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  header.set(new Uint8Array(rs.buffer), 16);
  header[20] = 65; // keyid length
  header.set(localPublicKey, 21);

  const encrypted = new Uint8Array(header.length + ciphertext.length);
  encrypted.set(header);
  encrypted.set(ciphertext, header.length);

  return { encrypted, salt, localPublicKey };
}

async function sendPushToEndpoint(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: object,
  vapidPrivateKey: CryptoKey
): Promise<{ success: boolean; gone: boolean; error?: string; status?: number }> {
  try {
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const { encrypted } = await encryptPayload(p256dh, auth, payloadBytes);

    const jwt = await createJwt(endpoint, VAPID_SUBJECT, vapidPrivateKey);
    const vapidAuth = `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidAuth,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "high",
      },
      body: encrypted,
    });

    if (response.status === 410 || response.status === 404) {
      return { success: false, gone: true, status: response.status };
    }

    if (response.status < 200 || response.status >= 300) {
      const body = await response.text().catch(() => "");
      console.error(`[Push] Endpoint returned ${response.status}: ${body}`);
      return { success: false, gone: false, status: response.status, error: body };
    }

    return { success: true, gone: false, status: response.status };
  } catch (err) {
    console.error("[Push] Send failed:", err);
    return { success: false, gone: false, error: String(err) };
  }
}

// ── CORS headers (needed on every response, not just OPTIONS) ────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { folio, estado, cliente_nombre } = await req.json();

    if (!folio || !estado) {
      return new Response(JSON.stringify({ error: "folio and estado required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all push subscriptions for this folio
    const { data: subscriptions, error: fetchErr } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, keys_p256dh, keys_auth")
      .eq("folio", folio);

    if (fetchErr) {
      console.error("[Push] DB fetch error:", fetchErr.message);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPrivateKey = await importVapidKey(VAPID_PRIVATE_KEY);
    const content = getNotificationContent(estado, cliente_nombre || "Cliente", folio);
    const payload = { title: content.title, body: content.body, folio };

    let sent = 0;
    const expired: string[] = [];
    const errors: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        const result = await sendPushToEndpoint(
          sub.endpoint,
          sub.keys_p256dh,
          sub.keys_auth,
          payload,
          vapidPrivateKey
        );
        if (result.success) sent++;
        if (result.gone) expired.push(sub.id);
        if (result.error) errors.push(`status=${result.status}: ${result.error}`);
      })
    );

    // Cleanup expired subscriptions
    if (expired.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expired);
    }

    return new Response(
      JSON.stringify({ sent, expired: expired.length, total: subscriptions.length, errors }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[Push] Unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

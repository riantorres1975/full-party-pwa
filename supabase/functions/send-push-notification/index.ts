// Supabase Edge Function: send-push-notification
// Sends Web Push notifications to customers when order status changes.
// Deploy: supabase functions deploy send-push-notification --no-verify-jwt
// Secrets needed: VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@fullparty.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// ── Notification messages per status ──────────────────────────────────────
function getNotificationContent(estado: string, nombre: string, folio: string) {
  switch (estado) {
    case "Armando Pedido":
      return {
        title: "🛍️ Preparando tu pedido",
        body: `Hola ${nombre}, ya estamos preparando tu pedido ${folio}. Te avisamos cuando esté listo.`,
      };
    case "Listo para Entrega":
      return {
        title: "✅ Tu pedido está listo",
        body: `Hola ${nombre}, tu pedido ${folio} ya está listo para entrega.`,
      };
    case "Cancelado":
      return {
        title: "❌ Pedido cancelado",
        body: `Hola ${nombre}, tu pedido ${folio} ha sido cancelado. Contáctanos si tienes dudas.`,
      };
    default:
      return {
        title: "📦 Actualización de pedido",
        body: `Hola ${nombre}, tu pedido ${folio} tiene una actualización: ${estado}.`,
      };
  }
}

// ── CORS headers ─────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

function jsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { folio, estado, cliente_nombre } = await req.json();

    if (!folio || !estado) {
      return jsonResponse({ error: "folio and estado required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscriptions, error: fetchErr } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, keys_p256dh, keys_auth")
      .eq("folio", folio);

    if (fetchErr) {
      console.error("[Push] DB fetch error:", fetchErr.message);
      return jsonResponse({ error: "DB error" }, 500);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return jsonResponse({ sent: 0, message: "No subscriptions" });
    }

    const content = getNotificationContent(estado, cliente_nombre || "Cliente", folio);
    const payload = JSON.stringify({ title: content.title, body: content.body, folio });

    let sent = 0;
    const expired: string[] = [];
    const errors: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload, {
            TTL: 86400,
            urgency: 'high',
            topic: folio,
          });
          sent++;
        } catch (err: any) {
          console.error(`[Push] Send failed (${err.statusCode}):`, err.body || err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            expired.push(sub.id);
          } else {
            errors.push(`status=${err.statusCode}: ${err.body || err.message}`);
          }
        }
      })
    );

    // Cleanup expired subscriptions
    if (expired.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expired);
    }

    return jsonResponse({ sent, expired: expired.length, total: subscriptions.length, errors });
  } catch (err) {
    console.error("[Push] Unhandled error:", err);
    return jsonResponse({ error: "Internal error: " + String(err) }, 500);
  }
});

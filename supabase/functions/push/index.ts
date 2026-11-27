// Web push for Yomak: mode "morning" (called by cron every 15 min) and mode "dm" (called by a DB trigger).
// Auth: shared secret header x-push-secret (function JWT check is off). Secrets: PUSH_SECRET, VAPID_PUBLIC, VAPID_PRIVATE.
import webpush from "npm:web-push@3.6.7";
const url = Deno.env.get("SUPABASE_URL")!, svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const H = { apikey: svc, Authorization: "Bearer " + svc, "Content-Type": "application/json" };
webpush.setVapidDetails("https://github.com/omarkhaleel432/-Yomak", Deno.env.get("VAPID_PUBLIC") || "", Deno.env.get("VAPID_PRIVATE") || "");
const ok = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
async function j(u: string) { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } }
async function send(sub: any, payload: unknown) {
  try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 3600 }); return true; }
  catch (e: any) {
    if (e && (e.statusCode === 404 || e.statusCode === 410))
      await fetch(`${url}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: "DELETE", headers: H });
    return false;
  }
}
async function market(country: string) {
  const sa = country === "SA";
  const [w, fx, g] = await Promise.all([
    j(`https://api.open-meteo.com/v1/forecast?latitude=${sa ? 24.71 : 30.04}&longitude=${sa ? 46.68 : 31.24}&current=temperature_2m&daily=temperature_2m_max&timezone=auto&forecast_days=1`),
    j("https://open.er-api.com/v6/latest/USD"), j("https://api.gold-api.com/price/XAU")]);
  const parts: string[] = [];
  const t = w?.current?.temperature_2m; if (typeof t === "number") parts.push(`${Math.round(t)}° ${sa ? "الرياض" : "القاهرة"}`);
  const rate = fx?.rates?.[sa ? "SAR" : "EGP"];
  if (typeof g?.price === "number" && typeof rate === "number") parts.push(`ذهب ٢١: ${Math.round(21 * g.price / 24 / 31.1035 * rate)} ${sa ? "ريال" : "جنيه"}`);
  if (typeof rate === "number") parts.push(`$١ = ${(Math.round(rate * 100) / 100)} ${sa ? "ريال" : "جنيه"}`);
  return parts.join(" · ");
}
Deno.serve(async (req) => {
  if (!svc || req.headers.get("x-push-secret") !== Deno.env.get("PUSH_SECRET") || !Deno.env.get("PUSH_SECRET")) return ok({ error: "no" }, 401);
  let b: any = {}; try { b = await req.json(); } catch { /* */ }
  if (b.mode === "dm") {
    if (!/^[0-9a-f-]{36}$/i.test(String(b.user_id))) return ok({ error: "bad" }, 400);
    const subs = await (await fetch(`${url}/rest/v1/push_subscriptions?select=*&user_id=eq.${b.user_id}`, { headers: H })).json();
    let n = 0; for (const s of subs || []) if (await send(s, { title: "💬 " + String(b.title || "رسالة جديدة").slice(0, 60), body: String(b.body || "").slice(0, 120), tag: "dm", url: "./index.html" })) n++;
    return ok({ sent: n });
  }
  if (b.mode === "notify") {
    if (!/^[0-9a-f-]{36}$/i.test(String(b.user_id))) return ok({ error: "bad" }, 400);
    const subs = await (await fetch(`${url}/rest/v1/push_subscriptions?select=*&user_id=eq.${b.user_id}`, { headers: H })).json();
    let n = 0; for (const s of subs || []) if (await send(s, { title: String(b.title || "يومك").slice(0, 60), body: String(b.body || "").slice(0, 120), tag: String(b.tag || "n").slice(0, 40), url: "./index.html" })) n++;
    return ok({ sent: n });
  }
  if (b.mode === "morning") {
    const subs = await (await fetch(`${url}/rest/v1/push_subscriptions?select=*&morning_on=eq.true`, { headers: H })).json();
    const now = new Date(), utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    const cache: Record<string, string> = {}; let n = 0;
    for (const s of subs || []) {
      const local = ((utcMin - s.tz_offset) % 1440 + 1440) % 1440;
      const day = new Date(now.getTime() - s.tz_offset * 60000).toISOString().slice(0, 10);
      if (s.last_sent === day || local < s.morning_min || local >= s.morning_min + 15) continue;
      const c = s.country === "SA" ? "SA" : "EG"; cache[c] ??= await market(c);
      if (await send(s, { title: "☀️ صباح الخير", body: (cache[c] || "افتح يومك وشوف مهامك ومواقيت الصلاة"), tag: "morning", url: "./index.html" })) {
        n++; await fetch(`${url}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: "PATCH", headers: H, body: JSON.stringify({ last_sent: day }) });
      }
    }
    return ok({ sent: n });
  }
  return ok({ error: "mode" }, 400);
});

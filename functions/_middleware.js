export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname === "/" || url.pathname.endsWith(".html")) {
    const city = request.cf.city || "Inconnue";
    const country = request.cf.country || "Inconnu";
    
    // On récupère la date et l'heure (format 2026-03-31-20h)
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hour = now.getUTCHours() + 2; // +2 pour l'heure de Paris (CEST)
    
    const statKey = `stats:${date}-${hour}h:${city}:${country}`;

    context.waitUntil(
      (async () => {
        const current = await env.STATS_VISITES.get(statKey);
        const count = (parseInt(current) || 0) + 1;
        await env.STATS_VISITES.put(statKey, count.toString());
      })()
    );
  }

  return next();
}
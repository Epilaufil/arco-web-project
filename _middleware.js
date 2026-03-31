export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // On ne loggue que les pages réelles
  if (url.pathname === "/" || url.pathname.endsWith(".html")) {
    const city = request.cf.city || "Inconnue";
    const country = request.cf.country || "Inconnu";
    const date = new Date().toISOString().split('T')[0];
    const statKey = `stats:${date}:${city}:${country}`;

    // On incrémente le compteur silencieusement
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
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";

  // 1. FILTRES ANTI-BOTS
  const botList = ["bot", "spider", "crawler", "ahrefs", "semrush", "uptime"];
  const isBot = botList.some(bot => ua.toLowerCase().includes(bot));
  const isValidPage = url.pathname === "/" || url.pathname.endsWith(".html");

  if (!isBot && isValidPage && request.method === "GET") {
    
    // 2. ANALYSE DE LA SOURCE (ÉLARGIE)
    let source = "Direct";
    if (referer) {
      try {
        const refHost = new URL(referer).hostname.toLowerCase();
        
        // Liste élargie des moteurs de recherche
        const searchEngines = ["google.", "bing.", "yahoo.", "duckduckgo.", "ecosia.", "qwant.", "baidu", "yandex"];
        // Liste des réseaux sociaux
        const socialPlatforms = ["instagram.com", "facebook.com", "t.co", "linkedin.com", "pinterest.", "tiktok."];

        if (searchEngines.some(engine => refHost.includes(engine))) {
          source = "Organic";
        } else if (socialPlatforms.some(platform => refHost.includes(platform))) {
          source = "Social";
        } else {
          source = "Referral"; // Un autre site web a mis un lien vers toi
        }
      } catch(e) { source = "Direct"; }
    }

// 3. ANALYSE OS (Version complète)
    let os = "Autre";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Linux")) os = "Linux"; // À placer avant Macintosh pour certains navigateurs
    else if (ua.includes("iPhone") || ua.includes("iPad") || (ua.includes("Macintosh") && "ontouchend" in request)) {
        os = "iOS"; // Gère les iPad récents qui se font passer pour des Mac
    } 
    else if (ua.includes("Macintosh")) os = "MacOS";

    let browser = "Autre";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";

    // 4. INFOS CLOUDFLARE**

    const city = request.cf.city || "Inconnue";
    const country = request.cf.country || "XX"; // XX si non détecté
    const date = new Date().toISOString().split('T')[0];

    // 5. CLÉ KV (stats:DATE:VILLE:SOURCE:OS:NAV)
        // Exemple : stats:2026-04-12:FR:Meudon:Organic:iOS:Safari
    const statKey = `stats:${date}:${country}:${city}:${source}:${os}:${browser}`;


    context.waitUntil(
      (async () => {
        try {
          const current = await env.STATS_VISITES.get(statKey);
          const count = (parseInt(current) || 0) + 1;
          await env.STATS_VISITES.put(statKey, count.toString());
        } catch (e) { console.error("KV Error:", e); }
      })()
    );
  }

  return next();
}
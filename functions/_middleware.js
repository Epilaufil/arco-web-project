export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

 
  const GOOGLE_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwQKvYNLNLDK5J3RKXI0vTP0Drb1jDBb5qWHcsm8aJl0ZuBd7YMLFjfxqfZ0-p6YKPi/exec";

  // On intercepte uniquement les appels de notre script de tracking
  if (url.pathname === "/api/analytics" && request.method === "POST") {
    try {
      const body = await request.json();
      const ua = request.headers.get("user-agent") || "";
      const referer = body.referer || "";

      // 1. ANALYSE DE LA SOURCE
      let source = "Direct";
      if (referer) {
        try {
          const refHost = new URL(referer).hostname.toLowerCase();
          const searchEngines = ["google.", "bing.", "yahoo.", "duckduckgo.", "ecosia.", "qwant.", "baidu", "yandex"];
          const socialPlatforms = ["instagram.com", "facebook.com", "t.co", "linkedin.com", "pinterest.", "tiktok."];

          if (searchEngines.some(engine => refHost.includes(engine))) {
            source = "Organic";
          } else if (socialPlatforms.some(platform => refHost.includes(platform))) {
            source = "Social";
          } else {
            source = "Referral";
          }
        } catch(e) { source = "Direct"; }
      }

      // 2. ANALYSE DU SYSTÈME (OS)
      let os = "Autre";
      if (ua.includes("Windows")) os = "Windows";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("iPhone") || ua.includes("iPad") || (ua.includes("Macintosh") && "ontouchend" in request)) {
          os = "iOS";
      } 
      else if (ua.includes("Macintosh")) os = "MacOS";

      // 3. ANALYSE DU NAVIGATEUR
      let browser = "Autre";
      if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
      else if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Edg")) browser = "Edge";

      // 4. RÉCUPÉRATION DE LA GÉOLOCALISATION CLOUDFLARE
      const city = request.cf?.city || "Inconnue";
      const country = request.cf?.country || "XX";
      
      // Date et heure précise (Heure de Paris)
      const dateStr = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

      // 5. ENVOI ARRIÈRE-PLAN VERS GOOGLE DRIVE
      const payload = {
        date: dateStr,
        type: body.type || "Visite",
        source: source,
        city: city,
        country: country,
        os: os,
        browser: browser
      };

      // Exécution asynchrone pour ne pas ralentir l'affichage du site
      context.waitUntil(
        fetch(GOOGLE_WEBAPP_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(err => console.error("Erreur WebApp Google:", err))
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
  }

  // Laisse le site internet se charger normalement pour le reste du trafic
  return next();
}
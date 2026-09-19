// One shareable link for both stores: https://ludoroyale.everease.org/get
// The device decides — Android goes to Google Play, iPhone/iPad to the App
// Store, anything else (desktop, unknown) lands on the home page. Everything
// that is not /get is served from the static assets as before.
const PLAY = "https://play.google.com/store/apps/details?id=com.factory.ludoroyale";
const APPSTORE = "https://apps.apple.com/app/id6798921153";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/get" || url.pathname === "/get/") {
      const ua = request.headers.get("user-agent") || "";
      let to = url.origin + "/";
      if (/android/i.test(ua)) to = PLAY;
      else if (/iphone|ipad|ipod/i.test(ua)) to = APPSTORE;
      return new Response(null, {
        status: 302,
        headers: { Location: to, Vary: "User-Agent", "Cache-Control": "no-store" },
      });
    }
    return env.ASSETS.fetch(request);
  },
};

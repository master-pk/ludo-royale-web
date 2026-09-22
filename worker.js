// Store links that remember where the tap came from.
//
//   https://ludoroyale.everease.org/get           the plain one (source "direct")
//   https://ludoroyale.everease.org/ig            Instagram
//   https://ludoroyale.everease.org/yt            YouTube
//   https://ludoroyale.everease.org/rd            Reddit
//   https://ludoroyale.everease.org/fam           friends and family
//   https://ludoroyale.everease.org/get?s=<tag>   any other source, lowercase letters
//
// The device decides the store: Android -> Google Play, iPhone/iPad -> App
// Store, anything else -> the home page. Android carries the source THROUGH the
// install as a Play install referrer (Firebase Analytics reads it on first open
// and reports source/medium/campaign with no app change). The App Store strips
// everything, so for iOS the source is attached as an Apple campaign token,
// which App Store Connect reports on its own. Every tap is counted here by
// source + platform (a count only — no cookies, no ids, nothing about the person).
const PLAY = "https://play.google.com/store/apps/details?id=com.factory.ludoroyale";
const APPSTORE = "https://apps.apple.com/app/id6798921153";
const SHORT = { ig: "instagram", yt: "youtube", rd: "reddit", fam: "family" };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const key = url.pathname.replace(/^\/|\/$/g, "");
    let source = null;
    if (key === "get") source = (url.searchParams.get("s") || "direct").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24) || "direct";
    else if (SHORT[key]) source = SHORT[key];
    if (source === null) return env.ASSETS.fetch(request);

    const ua = request.headers.get("user-agent") || "";
    const platform = /android/i.test(ua) ? "android" : /iphone|ipad|ipod/i.test(ua) ? "ios" : "other";
    let to = url.origin + "/?s=" + source;
    if (platform === "android") {
      // utm_* inside the referrer is exactly what Firebase parses on first open
      const ref = `utm_source=${source}&utm_medium=link&utm_campaign=${source}`;
      to = PLAY + "&referrer=" + encodeURIComponent(ref);
    } else if (platform === "ios") {
      // Apple's campaign parameters need the provider token; without it the App
      // Store ignores them, so send a clean link until APPLE_PT is set
      to = env.APPLE_PT ? `${APPSTORE}?pt=${env.APPLE_PT}&ct=${source}&mt=8` : APPSTORE;
    }
    if (env.CLICKS) {
      // Workers Analytics Engine: one row per tap. blobs = labels, doubles = count.
      ctx.waitUntil(Promise.resolve(env.CLICKS.writeDataPoint({
        blobs: [source, platform, request.cf?.country || ""], doubles: [1], indexes: [source] })));
    }
    return new Response(null, {
      status: 302,
      headers: { Location: to, Vary: "User-Agent", "Cache-Control": "no-store" },
    });
  },
};

export function normalizeWpUrl(url?: string | null) {
  if (!url) return "";

  return url
    .replace("https://taqwatrend.local", "https://prickly-land.localsite.io")
    .replace("http://taqwatrend.local", "https://prickly-land.localsite.io");
}
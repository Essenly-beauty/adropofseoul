import { adsTxtLine } from "@/lib/adsense";

export function GET() {
  const line = adsTxtLine(process.env.GOOGLE_ADSENSE_ACCOUNT);
  if (!line) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(`${line}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

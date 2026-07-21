import { ImageResponse } from "next/og";
import { getPlaceBySlug } from "@/services/places";
import { placeOgSubtitle } from "@/lib/og";

export const dynamic = "force-dynamic";

// Generated share card for places without a real photo. English text only:
// satori's bundled font has no Korean glyphs (name_kr would render as tofu),
// and no emoji/star glyphs — rating is shown as plain "N.N / 5".
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) return new Response("Not found", { status: 404 });

  const subtitle = placeOgSubtitle(place);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#F2EDE5",
        padding: "72px 80px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 26,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#B78B62",
          }}
        >
          A Drop of Seoul · Seoul Directory
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: place.name.length > 26 ? 64 : 84,
            fontWeight: 700,
            color: "#1C1C1C",
            lineHeight: 1.05,
          }}
        >
          {place.name}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              color: "rgba(28,28,28,0.66)",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "2px solid #B78B62",
          paddingTop: 28,
        }}
      >
        <div style={{ fontSize: 28, color: "rgba(28,28,28,0.66)" }}>
          adropofseoul — Korean beauty & places worth knowing
        </div>
        {place.rating != null && (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              color: "#1C1C1C",
            }}
          >
            {`${place.rating.toFixed(1)} / 5`}
          </div>
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}

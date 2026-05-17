import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Cannes Command Center — your privacy-first Cannes Lions 2026 dashboard";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(at 20% 20%, #185f5a 0%, transparent 55%), radial-gradient(at 80% 80%, #e87d5c 0%, transparent 50%), linear-gradient(135deg, #0a2e2c, #0d3d3a)",
          color: "#fdfaf3",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "#fdfaf3",
              color: "#0d3d3a",
              fontSize: 32,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            C
            <div
              style={{
                position: "absolute",
                bottom: -6,
                right: -6,
                background: "#e87d5c",
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                width: 26,
                height: 26,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Helvetica, sans-serif",
              }}
            >
              26
            </div>
          </div>
          <div
            style={{
              fontFamily: "Helvetica, sans-serif",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#f7eedd",
              opacity: 0.85,
              display: "flex",
            }}
          >
            Cannes Command Center
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 600,
              lineHeight: 1.02,
              letterSpacing: -1,
              maxWidth: 1000,
              display: "flex",
            }}
          >
            Your <span style={{ color: "#e87d5c", marginLeft: 18 }}>command center</span>
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 500,
              lineHeight: 1.05,
              display: "flex",
            }}
          >
            for Cannes Lions 2026.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontFamily: "Helvetica, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 22,
              opacity: 0.82,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span>Events · Status · People · Privacy-first</span>
            <span style={{ opacity: 0.7, fontSize: 18 }}>22–26 June · La Croisette</span>
          </div>
          <div
            style={{
              padding: "12px 22px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.25)",
              fontSize: 18,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: 600,
              display: "flex",
            }}
          >
            Local-only by design
          </div>
        </div>
      </div>
    ),
    size
  );
}

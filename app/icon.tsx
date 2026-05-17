import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0d3d3a",
          color: "#fdfaf3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          fontWeight: 600,
          fontSize: 38,
          borderRadius: 16,
          position: "relative",
        }}
      >
        C
        <div
          style={{
            position: "absolute",
            bottom: 6,
            right: 6,
            background: "#e87d5c",
            color: "white",
            fontSize: 11,
            fontWeight: 700,
            width: 20,
            height: 20,
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
    ),
    size
  );
}

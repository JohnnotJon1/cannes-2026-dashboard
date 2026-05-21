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
          fontFamily: "Helvetica, sans-serif",
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: -1,
          borderRadius: 16,
        }}
      >
        26
      </div>
    ),
    size
  );
}

import { ImageResponse } from "next/og";

// Apple-Touch-Icon (iPhone-Home-Bildschirm). iOS rundet die Ecken selbst,
// deshalb vollflächiger anthrazitfarbener Hintergrund mit weißem "AS".
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d1d1f",
          color: "#f5f5f7",
          fontSize: 94,
          letterSpacing: "-5px",
        }}
      >
        AS
      </div>
    ),
    { ...size }
  );
}

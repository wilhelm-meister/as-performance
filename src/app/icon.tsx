import { ImageResponse } from "next/og";

// App-Icon für das Manifest (Android/Chrome-Installation) und moderne Browser.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 268,
          letterSpacing: "-14px",
        }}
      >
        AS
      </div>
    ),
    { ...size }
  );
}

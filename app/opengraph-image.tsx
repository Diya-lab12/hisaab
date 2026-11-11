import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const alt = "Claimatic: consumer complaint notices signed by an advocate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";


export default function Image() {
  const logo = "data:image/png;base64," + readFileSync(join(process.cwd(), "public", "logo.png")).toString("base64");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#faf8f4", color: "#101c2b" }}>
        <div style={{ display: "flex" }}>
          <img src={logo} width={400} height={98} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.08, maxWidth: 940 }}>Consumer complaint? Get a notice signed by an advocate.</div>
          <div style={{ fontSize: 34, color: "#4d5a69" }}>Under the Consumer Protection Act, 2019.</div>
        </div>
        <div style={{ height: 8, width: 160, background: "#8a6a2f" }} />
      </div>
    ),
    size,
  );
}

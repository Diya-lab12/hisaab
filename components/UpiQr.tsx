"use client";
import { useEffect, useState } from "react";

/** A QR code for a upi:// link, drawn in the browser so nothing about the payment leaves the page. */
export default function UpiQr({ link }: { link: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    import("qrcode")
      .then((m) => m.toDataURL(link, { margin: 1, width: 240, errorCorrectionLevel: "M" }))
      .then((u) => live && setSrc(u))
      .catch(() => live && setSrc(null));
    return () => {
      live = false;
    };
  }, [link]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img className="upi-qr" src={src} width={200} height={200} alt="UPI QR code. Scan it with any UPI app to pay." /> : <div className="upi-qr" aria-hidden="true" />;
}

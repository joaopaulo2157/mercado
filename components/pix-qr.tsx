"use client";

import { useEffect, useRef, useState } from "react";

export default function PixQr({ payload }: { payload: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!payload || !canvas.current) return;
    let active = true;
    import("qrcode")
      .then(({ toCanvas }) => {
        if (!active || !canvas.current) return;
        return toCanvas(canvas.current, payload, {
          width: 220,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#10233f", light: "#ffffff" },
        });
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [payload]);

  if (error)
    return (
      <p className="pix-qr-error">
        Não foi possível desenhar o QR Code. Use o botão “Copiar código PIX”.
      </p>
    );
  return <canvas ref={canvas} aria-label="QR Code PIX do pedido" />;
}

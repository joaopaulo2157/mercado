"use client";

export default function PrintButton() {
  return <button onClick={() => window.print()}>Imprimir pedido</button>;
}

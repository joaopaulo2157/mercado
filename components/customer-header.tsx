import Image from "next/image";
import Link from "next/link";

export default function CustomerHeader() {
  return (
    <header className="customer-header">
      <Link href="/" aria-label="Voltar à página inicial">
        <Image
          src="/assets/sc-supermercado-central-oficial.png"
          alt="Supermercado Central"
          width={230}
          height={86}
          priority
        />
      </Link>
      <nav>
        <Link href="/#ofertas">Comprar</Link>
        <Link href="/acompanhar">Acompanhar</Link>
        <Link href="/meus-pedidos">Meus pedidos</Link>
      </nav>
    </header>
  );
}

import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Você está offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section>
        <Image src="/assets/sc-supermercado-central-oficial.png" alt="Supermercado Central" width={230} height={96} priority />
        <span>SEM CONEXÃO</span>
        <h1>Internet indisponível no momento</h1>
        <p>Assim que a conexão voltar, recarregue a loja para consultar preços, estoque e ofertas atualizados.</p>
        <Link href="/">Tentar novamente</Link>
      </section>
    </main>
  );
}

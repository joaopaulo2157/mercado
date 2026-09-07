import Link from "next/link";
import CustomerHeader from "@/components/customer-header";

export type PolicySection = {
  title: string;
  text?: string;
  items?: string[];
};

export default function PolicyPage({
  kicker,
  title,
  intro,
  sections,
}: {
  kicker: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <main className="customer-page policy-page">
      <CustomerHeader />
      <section className="policy-hero">
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <section className="policy-content">
        <aside>
          <span>ATENDIMENTO HUMANO</span>
          <h2>Ficou com alguma dúvida?</h2>
          <p>
            A equipe confirma disponibilidade, prazo, valor final e qualquer
            situação especial diretamente pelo WhatsApp.
          </p>
          <Link href="/#contato">Falar com a loja</Link>
        </aside>
        <div>
          {sections.map((section, index) => (
            <article key={section.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{section.title}</h2>
                {section.text ? <p>{section.text}</p> : null}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="customer-footer">
        <Link href="/">Voltar à loja</Link>
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos de uso</Link>
      </footer>
    </main>
  );
}

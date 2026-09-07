import Link from "next/link";

export const metadata = {
  title: "Privacidade e LGPD | Supermercado Central",
  description: "Saiba como os dados são utilizados durante o pedido online.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div>
        <span>PRIVACIDADE E LGPD</span>
        <h1>Seus dados usados para atender e acompanhar seu pedido.</h1>
        <p>
          Esta página explica, de forma simples, quais informações são
          utilizadas durante sua experiência no catálogo digital do Supermercado
          Central.
        </p>
        <section>
          <h2>1. Dados informados no pedido</h2>
          <p>
            Nome, telefone, CEP, endereço, cidade, área de entrega, referência,
            forma de pagamento, preferência de substituição e observações são
            registrados para preparar, confirmar, entregar e acompanhar o
            pedido. Não solicitamos dados completos de cartão pelo site.
          </p>
          <h2>2. Consulta de CEP</h2>
          <p>
            O CEP pode ser enviado ao serviço ViaCEP para sugerir rua, cidade e
            estado. O cliente sempre pode revisar e completar o endereço antes
            de registrar a compra.
          </p>
          <h2>3. Carrinho, favoritos e histórico local</h2>
          <p>
            Carrinho, favoritos, produtos recentes e atalhos para pedidos ficam
            armazenados no próprio navegador para facilitar sua próxima visita.
            Você pode removê-los limpando os dados do site no navegador.
          </p>
          <h2>4. Estatísticas de uso</h2>
          <p>
            Registramos eventos como visita, busca, adição ao carrinho e
            abertura do WhatsApp para melhorar o catálogo. Essas estatísticas
            não precisam identificar o cliente.
          </p>
          <h2>5. Fidelidade, indicação e avaliações</h2>
          <p>
            O telefone identifica o saldo de pontos, o histórico comercial e o
            código de indicação. Avaliações só são aceitas após compras
            concluídas e passam por moderação antes da publicação.
          </p>
          <h2>6. WhatsApp</h2>
          <p>
            Ao finalizar, você será direcionado ao WhatsApp com uma mensagem de
            pedido. A conversa passa a seguir também os termos e a política do
            WhatsApp.
          </p>
          <h2>7. Retenção e direitos</h2>
          <p>
            Os pedidos podem ser mantidos pelo período necessário ao
            atendimento, controle comercial e obrigações legais. Você pode
            solicitar acesso, correção ou exclusão dos seus dados diretamente à
            loja.
          </p>
          <h2>8. Segurança</h2>
          <p>
            Links de acompanhamento usam tokens próprios, consultas manuais
            exigem pedido e telefone correspondentes, o painel administrativo
            possui acesso restrito e alterações ficam registradas.
          </p>
        </section>
        <small>Última atualização: 23 de agosto de 2026.</small>
        <Link href="/">← Voltar ao Supermercado Central</Link>
      </div>
    </main>
  );
}

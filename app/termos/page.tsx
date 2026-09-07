import type { Metadata } from "next";
import PolicyPage from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Termos de uso",
  description:
    "Termos de uso do catálogo e dos pedidos do Supermercado Central.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      kicker="REGRAS DA EXPERIÊNCIA DIGITAL"
      title="Transparência do carrinho ao atendimento."
      intro="Ao usar o catálogo e registrar um pedido, você concorda com as condições abaixo. A compra somente é concluída após a confirmação do atendimento pelo WhatsApp."
      sections={[
        {
          title: "Natureza do catálogo",
          text: "O site facilita a montagem e o envio da lista. Preços, estoque, peso de itens variáveis, descontos e disponibilidade podem ser confirmados ou ajustados antes da finalização comercial.",
        },
        {
          title: "Cadastro do pedido",
          text: "O cliente deve fornecer dados corretos de contato, entrega e pagamento. O número de pedido serve para identificação e acompanhamento, mas não substitui a confirmação da loja.",
        },
        {
          title: "Pagamento",
          text: "As formas habilitadas aparecem no checkout. Códigos PIX gerados pelo site devem ser conferidos com o atendente, incluindo favorecido e valor, antes do pagamento.",
        },
        {
          title: "Ofertas, cupons e campanhas",
          text: "Promoções podem ter período, estoque, quantidade, pedido mínimo e limite de uso. Cupons incompatíveis ou expirados são rejeitados automaticamente no registro do pedido.",
        },
        {
          title: "Uso responsável",
          text: "Não é permitido tentar interferir no funcionamento do site, registrar pedidos fraudulentos ou utilizar dados de terceiros sem autorização.",
        },
        {
          title: "Atualizações",
          text: "Estes termos podem evoluir junto com os serviços. A versão disponível no site é a aplicável ao uso realizado naquele momento.",
        },
      ]}
    />
  );
}

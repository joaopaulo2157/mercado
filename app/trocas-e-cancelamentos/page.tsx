import type { Metadata } from "next";
import PolicyPage from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Trocas e cancelamentos",
  description:
    "Orientações para alterações, cancelamentos e solução de divergências em pedidos.",
};

export default function ExchangesAndCancellationsPage() {
  return (
    <PolicyPage
      kicker="SUPORTE AO PEDIDO"
      title="Resolver rápido também faz parte da compra."
      intro="Pedidos de supermercado podem envolver produtos frescos, peso variável e disponibilidade dinâmica. Por isso, nossa equipe trata cada caso diretamente com o cliente."
      sections={[
        {
          title: "Alterar ou cancelar antes da separação",
          text: "Fale com o atendente no mesmo WhatsApp da compra e informe o número do pedido. Se a separação ainda não tiver começado, a solicitação poderá ser ajustada com mais facilidade.",
        },
        {
          title: "Substituições",
          items: [
            "Confirmar antes de substituir: a equipe consulta você no WhatsApp.",
            "Pode substituir por similar: será escolhido um item equivalente sempre que possível.",
            "Não substituir: o item indisponível será retirado do valor final.",
          ],
        },
        {
          title: "Produto divergente ou com problema",
          text: "Guarde o item e o comprovante e entre em contato assim que identificar a divergência. Produtos perecíveis exigem comunicação rápida para avaliação adequada.",
        },
        {
          title: "Estornos e devoluções",
          text: "Quando aplicável, o método e o prazo do estorno dependem da forma de pagamento e da análise do atendimento. A equipe informará o procedimento correspondente.",
        },
        {
          title: "Pontos de fidelidade",
          text: "Os pontos são creditados após a conclusão. Em caso de cancelamento de um pedido já concluído no sistema, o saldo correspondente poderá ser ajustado.",
        },
      ]}
    />
  );
}

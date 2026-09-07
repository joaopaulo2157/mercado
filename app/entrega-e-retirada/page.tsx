import type { Metadata } from "next";
import PolicyPage from "@/components/policy-page";

export const metadata: Metadata = {
  title: "Entrega e retirada",
  description:
    "Entenda como funcionam entrega, taxas, prazos e retirada no Supermercado Central.",
};

export default function DeliveryAndPickupPage() {
  return (
    <PolicyPage
      kicker="COMO RECEBER SUA COMPRA"
      title="Entrega simples, retirada sem complicação."
      intro="Você escolhe a forma de recebimento durante o checkout. A equipe confirma disponibilidade, valor e prazo no WhatsApp antes de finalizar a compra."
      sections={[
        {
          title: "Áreas e taxas de entrega",
          text: "As áreas disponíveis aparecem no checkout. A taxa e o pedido mínimo são calculados automaticamente conforme a região selecionada e o valor dos produtos.",
        },
        {
          title: "Consulta de CEP",
          text: "Ao informar o CEP, o site busca rua, cidade e estado para agilizar o preenchimento. Revise número, complemento, área de entrega e referência antes de enviar.",
        },
        {
          title: "Prazos e agendamento",
          items: [
            "A estimativa da área é exibida no checkout e confirmada pelo atendente.",
            "Você pode solicitar manhã, tarde, noite ou atendimento assim que possível.",
            "Trânsito, clima, estoque e volume de pedidos podem alterar a previsão.",
          ],
        },
        {
          title: "Retirada na loja",
          text: "A retirada é na Avenida Deputado Elisio da Silva Maia, 19, Centro, São José da Tapera/AL. O atendimento informado é das 7h30 às 21h. Aguarde a confirmação de que o pedido está separado antes de se deslocar até a loja.",
        },
        {
          title: "Recebimento",
          text: "Confira volumes, itens refrigerados e possíveis substituições no recebimento. Informe qualquer divergência ao atendimento assim que possível.",
        },
      ]}
    />
  );
}

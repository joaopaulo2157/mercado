export const ORDER_STATUSES = [
  "whatsapp_pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  whatsapp_pending: "Aguardando confirmação",
  confirmed: "Pedido confirmado",
  preparing: "Em separação",
  out_for_delivery: "Saiu para entrega",
  completed: "Pedido concluído",
  cancelled: "Pedido cancelado",
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  whatsapp_pending:
    "O pedido foi registrado e aguarda confirmação no WhatsApp.",
  confirmed: "A equipe confirmou disponibilidade, valor e atendimento.",
  preparing: "Os produtos estão sendo separados e conferidos.",
  out_for_delivery: "O pedido está a caminho do endereço informado.",
  completed: "A compra foi finalizada com sucesso.",
  cancelled: "Este pedido foi cancelado.",
};

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  ORDER_STATUSES.includes(value as OrderStatus);

const field = (id: string, value: string) =>
  `${id}${String(value.length).padStart(2, "0")}${value}`;

const normalize = (value: string, max: number) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .-]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, max);

const crc16 = (payload: string) => {
  let result = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    result ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1)
      result = result & 0x8000 ? (result << 1) ^ 0x1021 : result << 1;
  }
  return (result & 0xffff).toString(16).toUpperCase().padStart(4, "0");
};

export function buildPixPayload({
  key,
  merchantName,
  merchantCity,
  amountCents,
  txid,
}: {
  key: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  txid: string;
}) {
  if (!key.trim()) return "";
  const merchantAccount =
    field("00", "BR.GOV.BCB.PIX") + field("01", key.trim());
  const additionalData = field("05", normalize(txid, 25) || "***");
  const amount = Math.max(0, amountCents / 100).toFixed(2);
  const base =
    field("00", "01") +
    field("01", "12") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986") +
    field("54", amount) +
    field("58", "BR") +
    field("59", normalize(merchantName, 25) || "SUPERMERCADO CENTRAL") +
    field("60", normalize(merchantCity, 15) || "MACEIO") +
    field("62", additionalData) +
    "6304";
  return `${base}${crc16(base)}`;
}

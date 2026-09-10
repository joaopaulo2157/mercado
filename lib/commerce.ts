import type {
  CartOptions,
  ItemSubstitution,
  Product,
  ProductOption,
} from "./store-types";

const ACCENTS = /[\u0300-\u036f]/g;

export const normalizeSearch = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(ACCENTS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const parseProductOptions = (value: unknown): ProductOption[] => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, 20)
      .map((item, index) => {
        const row = item as Partial<ProductOption>;
        const label = String(row.label ?? "").trim().slice(0, 80);
        const priceCents = Math.max(0, Math.round(Number(row.priceCents ?? 0)));
        if (!label || !priceCents) return null;
        return {
          id: String(row.id || `opcao-${index + 1}`).slice(0, 80),
          label,
          priceCents,
          oldPriceCents:
            row.oldPriceCents == null
              ? null
              : Math.max(0, Math.round(Number(row.oldPriceCents))),
          barcode: String(row.barcode ?? "").replace(/\D/g, "").slice(0, 40),
        } satisfies ProductOption;
      })
      .filter((item): item is ProductOption => Boolean(item));
  } catch {
    return [];
  }
};

export const selectedOption = (
  product: Product,
  optionId?: string,
): ProductOption | null =>
  product.options.find((option) => option.id === optionId) ||
  product.options[0] ||
  null;

export const productPrice = (product: Product, optionId?: string) =>
  selectedOption(product, optionId)?.priceCents ?? product.priceCents;

export const productOldPrice = (product: Product, optionId?: string) =>
  selectedOption(product, optionId)?.oldPriceCents ?? product.oldPriceCents;

export const productStep = (product: Product) =>
  product.saleMode === "weight"
    ? Math.max(0.05, product.quantityStep || 0.25)
    : Math.max(1, product.quantityStep || 1);

export const productMinimum = (product: Product) =>
  Math.max(productStep(product), product.minimumQuantity || productStep(product));

export const changeProductQuantity = (
  product: Product,
  current: number,
  stepDelta: number,
) => {
  const step = productStep(product);
  const minimum = productMinimum(product);
  const raw = current > 0 ? current + step * stepDelta : minimum;
  if (raw < minimum - step / 2) return 0;
  const precision = product.saleMode === "weight" ? 1000 : 1;
  return Math.min(
    product.stockQuantity,
    Math.round(Math.max(minimum, raw) * precision) / precision,
  );
};

export const formatQuantity = (
  product: Pick<Product, "saleMode">,
  quantity: number,
) => {
  if (product.saleMode === "weight")
    return `${quantity.toLocaleString("pt-BR", {
      minimumFractionDigits: quantity % 1 ? 2 : 0,
      maximumFractionDigits: 3,
    })} kg`;
  return `${quantity.toLocaleString("pt-BR")} ${quantity === 1 ? "un." : "un."}`;
};

export const substitutionLabel = (value: ItemSubstitution) =>
  value === "similar"
    ? "Pode substituir por similar"
    : value === "none"
      ? "Não substituir"
      : "Confirmar antes";

const oneEditApart = (left: string, right: string) => {
  if (left === right) return true;
  if (Math.abs(left.length - right.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (left.length > right.length) i += 1;
    else if (right.length > left.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  if (i < left.length || j < right.length) edits += 1;
  return edits <= 1;
};

const fuzzyTermMatch = (term: string, words: string[], searchable: string) => {
  if (searchable.includes(term)) return true;
  if (term.length < 4) return false;
  return words.some((word) =>
    word.startsWith(term) || oneEditApart(term, word),
  );
};

export const productSearchScore = (product: Product, query: string) => {
  const normalized = normalizeSearch(query);
  if (!normalized) return 1;
  const terms = normalized.split(" ").filter(Boolean);
  const name = normalizeSearch(product.name);
  const category = normalizeSearch(product.categoryName);
  const brand = normalizeSearch(product.brand);
  const searchable = normalizeSearch(
    [
      product.name,
      product.brand,
      product.categoryName,
      product.sku,
      product.barcode,
      product.description,
      ...product.options.flatMap((option) => [option.label, option.barcode]),
    ].join(" "),
  );
  const words = searchable.split(" ").filter(Boolean);
  if (!terms.every((term) => fuzzyTermMatch(term, words, searchable))) return 0;
  return terms.reduce((score, term) => {
    if (name === term) return score + 100;
    if (name.startsWith(term)) return score + 55;
    if (name.includes(term)) return score + 35;
    if (brand.startsWith(term)) return score + 22;
    if (category.includes(term)) return score + 12;
    if (words.some((word) => oneEditApart(term, word))) return score + 9;
    return score + 5;
  }, product.featured ? 8 : 0);
};

export const optionSummary = (product: Product, options: CartOptions) =>
  selectedOption(product, options[product.id])?.label || product.unit;

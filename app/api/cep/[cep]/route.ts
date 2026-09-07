type ViaCepPayload = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  estado?: string;
  regiao?: string;
  erro?: boolean | "true";
};

const clean = (value: unknown, max = 160) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cep: string }> },
) {
  const { cep: rawCep } = await params;
  const cep = rawCep.replace(/\D/g, "");
  if (cep.length !== 8)
    return Response.json(
      { error: "Informe um CEP com 8 números" },
      { status: 400 },
    );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 86_400 },
    });
    if (!response.ok)
      return Response.json(
        { error: "Não foi possível consultar o CEP" },
        { status: 502 },
      );
    const data = (await response.json()) as ViaCepPayload;
    if (data.erro === true || data.erro === "true")
      return Response.json({ error: "CEP não encontrado" }, { status: 404 });

    return Response.json(
      {
        cep: clean(data.cep, 10),
        street: clean(data.logradouro),
        complement: clean(data.complemento),
        neighborhood: clean(data.bairro),
        city: clean(data.localidade, 100),
        state: clean(data.uf, 2),
        stateName: clean(data.estado, 100),
        region: clean(data.regiao, 40),
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "A consulta de CEP está indisponível. Preencha manualmente." },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

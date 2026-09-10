import Image from "next/image";
import Link from "next/link";
import { configuredAdminEmails, safeRelativeReturnPath } from "@/app/chatgpt-auth";
import { adminTotpConfigured } from "@/lib/totp";
import { database } from "@/lib/database";
import { ensureV5SecuritySchema } from "@/lib/v5-schema";
import styles from "./login.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Entrar no painel | Supermercado Central",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const returnTo = safeRelativeReturnPath(
    typeof params.return_to === "string" ? params.return_to : "/admin",
  );
  const email = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : "";
  const ownerConfigured =
    configuredAdminEmails().length > 0 &&
    Boolean(process.env.ADMIN_PASSWORD) &&
    Boolean(process.env.ADMIN_SESSION_SECRET);
  let staffConfigured = false;
  if (process.env.ADMIN_SESSION_SECRET) {
    try {
      await ensureV5SecuritySchema();
      const row = await database()
        .prepare(
          "SELECT COUNT(*) AS total FROM staff WHERE active=1 AND password_hash<>''",
        )
        .first<{ total: number }>();
      staffConfigured = Number(row?.total || 0) > 0;
    } catch {
      staffConfigured = false;
    }
  }
  const configured = ownerConfigured || staffConfigured;
  const totpEnabled = adminTotpConfigured();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          src="/assets/logo-central-vertical.png"
          alt="Supermercado Central"
          width={190}
          height={136}
          priority
        />
        <span className={styles.eyebrow}>PAINEL ADMINISTRATIVO</span>
        <h1>Acesso seguro</h1>
        <p>
          Entre com seu e-mail e sua senha. Cada membro da equipe pode ter credenciais próprias, e contas protegidas usam código 2FA.
        </p>

        {!configured && (
          <div className={styles.warning}>
            Configure a conta proprietária com <b>ADMIN_EMAILS</b>, <b>ADMIN_PASSWORD</b> e <b>ADMIN_SESSION_SECRET</b>, ou crie uma conta individual ativa para a equipe.
          </div>
        )}
        {error === "invalid" && (
          <div className={styles.error}>E-mail ou senha inválidos.</div>
        )}
        {error === "locked" && (
          <div className={styles.error}>Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.</div>
        )}
        {error === "mfa" && (
          <div className={styles.error}>Código de autenticação inválido ou expirado.</div>
        )}
        {error === "mfa_setup" && (
          <div className={styles.error}>Esta conta exige 2FA, mas ainda não foi configurada. Solicite ao administrador a ativação do autenticador.</div>
        )}

        <form action="/api/admin/session" method="post" className={styles.form}>
          <input type="hidden" name="returnTo" value={returnTo} />
          <label>
            E-mail
            <input
              type="email"
              name="email"
              defaultValue={email}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            Código 2FA {totpEnabled ? "" : "(quando ativo)"}
            <input
              type="text"
              name="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
            />
          </label>
          <button type="submit" disabled={!configured}>
            Entrar no painel
          </button>
        </form>

        <Link href="/" className={styles.back}>
          Voltar para a loja
        </Link>
      </section>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { configuredAdminEmails, safeRelativeReturnPath } from "@/app/chatgpt-auth";
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
  const hasError = params.error === "1";
  const configured = configuredAdminEmails().length > 0;

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
          Entre com um e-mail autorizado e a senha administrativa configurada
          no servidor.
        </p>

        {!configured && (
          <div className={styles.warning}>
            Configure <b>ADMIN_EMAILS</b>, <b>ADMIN_PASSWORD</b> e
            <b> ADMIN_SESSION_SECRET</b> nas variáveis de ambiente.
          </div>
        )}
        {hasError && (
          <div className={styles.error}>E-mail ou senha inválidos.</div>
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

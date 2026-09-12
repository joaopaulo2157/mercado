import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { safeRelativeReturnPath } from "@/app/chatgpt-auth";
import { adminIsConfigured } from "@/lib/admin-auth";
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
  if (!(await adminIsConfigured())) redirect("/admin/setup");

  const params = await searchParams;
  const returnTo = safeRelativeReturnPath(
    typeof params.return_to === "string" ? params.return_to : "/admin",
  );
  const email = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : "";

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
        <p>Entre com o e-mail e a senha cadastrados no painel.</p>

        {error === "invalid" && (
          <div className={styles.error}>E-mail ou senha inválidos.</div>
        )}
        {error === "locked" && (
          <div className={styles.error}>
            Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.
          </div>
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
          <button type="submit">Entrar no painel</button>
        </form>

        <Link href="/" className={styles.back}>
          Voltar para a loja
        </Link>
      </section>
    </main>
  );
}

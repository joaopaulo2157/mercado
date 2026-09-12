import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminIsConfigured } from "@/lib/admin-auth";
import styles from "../login/login.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Configurar administrador | Supermercado Central",
  robots: { index: false, follow: false },
};

export default async function AdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await adminIsConfigured()) redirect("/admin/login");
  const params = await searchParams;
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
        <span className={styles.eyebrow}>PRIMEIRA CONFIGURAÇÃO</span>
        <h1>Criar administrador</h1>
        <p>
          Este cadastro é liberado somente enquanto não existir nenhum administrador ativo.
          Depois de criado, esta tela é bloqueada automaticamente.
        </p>

        {error && <div className={styles.error}>{decodeURIComponent(error)}</div>}

        <form action="/api/admin/setup" method="post" className={styles.form}>
          <label>
            Seu nome
            <input type="text" name="name" autoComplete="name" required minLength={2} maxLength={120} />
          </label>
          <label>
            E-mail
            <input type="email" name="email" autoComplete="username" required maxLength={180} />
          </label>
          <label>
            Senha
            <input type="password" name="password" autoComplete="new-password" required minLength={12} maxLength={256} />
          </label>
          <label>
            Confirmar senha
            <input type="password" name="confirmPassword" autoComplete="new-password" required minLength={12} maxLength={256} />
          </label>
          <button type="submit">Criar administrador</button>
        </form>

        <Link href="/" className={styles.back}>Voltar para a loja</Link>
      </section>
    </main>
  );
}

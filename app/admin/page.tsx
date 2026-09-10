import Link from "next/link";
import Image from "next/image";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { requireAdminPage } from "@/lib/admin-auth";
import AdminDashboard from "@/components/admin-dashboard";
import "./admin.css";
import "./admin-v2.css";
import "./admin-v16.css";
import "./admin-v17.css";
import "./admin-v18.css";
import "./admin-v19.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Painel administrativo | Supermercado Central",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const { user, allowed, configured } = await requireAdminPage();
  if (!allowed)
    return (
      <main className="admin-access">
        <div className="access-card">
          <Image
            src="/assets/logo-central-vertical.png"
            alt="Supermercado Central"
            width={210}
            height={150}
          />
          <span>ACESSO PROTEGIDO</span>
          <h1>
            {configured
              ? "Usuário sem permissão"
              : "Administrador ainda não configurado"}
          </h1>
          <p>
            {configured
              ? `A conta ${user.email} não possui acesso administrativo ativo.`
              : "Cadastre o e-mail autorizado nas configurações seguras do projeto para liberar este painel."}
          </p>
          <div>
            <Link href="/">Voltar para a loja</Link>
            <a href={chatGPTSignOutPath("/admin")}>Trocar de conta</a>
          </div>
        </div>
      </main>
    );
  return (
    <AdminDashboard
      user={{ email: user.email, name: user.displayName }}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}

import { ForgotForm } from "./ForgotForm";

export default function EsqueciSenhaPage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Esqueci minha senha</h1>
      <ForgotForm />
    </main>
  );
}

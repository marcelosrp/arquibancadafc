import { SignUpForm } from "./SignUpForm";

export default function CadastroPage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <SignUpForm />
    </main>
  );
}

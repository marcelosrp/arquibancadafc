import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <LoginForm />
    </main>
  );
}

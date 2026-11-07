import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthCard title="Entrar">
      <LoginForm />
    </AuthCard>
  );
}

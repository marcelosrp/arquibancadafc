import { AuthCard } from "@/components/ui/auth-card";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthCard title="Entrar">
      <LoginForm />
    </AuthCard>
  );
}

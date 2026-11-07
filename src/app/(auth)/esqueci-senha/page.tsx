import { AuthCard } from "@/components/ui/auth-card";
import { ForgotForm } from "./ForgotForm";

export default function EsqueciSenhaPage() {
  return (
    <AuthCard title="Esqueci minha senha">
      <ForgotForm />
    </AuthCard>
  );
}

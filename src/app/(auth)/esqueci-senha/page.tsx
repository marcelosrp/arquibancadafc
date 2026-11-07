import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotForm } from "./ForgotForm";

export default function EsqueciSenhaPage() {
  return (
    <AuthCard title="Esqueci minha senha">
      <ForgotForm />
    </AuthCard>
  );
}

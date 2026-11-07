import { AuthCard } from "@/components/auth/AuthCard";
import { SignUpForm } from "./SignUpForm";

export default function CadastroPage() {
  return (
    <AuthCard title="Criar conta">
      <SignUpForm />
    </AuthCard>
  );
}

import { AuthCard } from "@/components/ui/auth-card";
import { SignUpForm } from "./SignUpForm";

export default function CadastroPage() {
  return (
    <AuthCard title="Criar conta">
      <SignUpForm />
    </AuthCard>
  );
}

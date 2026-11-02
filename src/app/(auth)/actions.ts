"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { EmailTakenError, registerUser, TeamNotFoundError } from "@/modules/auth/register";
import { registerSchema } from "@/modules/auth/schemas";

export type FormState = { error?: string; fieldErrors?: Record<string, string[] | undefined> };

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    favoriteTeamId: formData.get("favoriteTeamId"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof EmailTakenError) return { error: "Este e-mail já está cadastrado." };
    if (error instanceof TeamNotFoundError) return { error: "Clube não encontrado." };
    throw error;
  }
  return signInWith(parsed.data.email, parsed.data.password);
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return signInWith(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

async function signInWith(email: string, password: string): Promise<FormState> {
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    // Successful sign-in throws a redirect; anything that isn't an AuthError must propagate.
    if (!(error instanceof AuthError)) throw error;
    if ((error as { code?: string }).code === "rate_limited") {
      return { error: "Muitas tentativas. Tente novamente em alguns minutos." };
    }
    return { error: "E-mail ou senha inválidos." };
  }
  return {};
}

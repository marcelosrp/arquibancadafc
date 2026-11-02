import { hash, verify } from "@node-rs/argon2";

/** Argon2id (the library default) with its default cost parameters. */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

export async function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  try {
    return await verify(passwordHash, plain);
  } catch {
    return false;
  }
}

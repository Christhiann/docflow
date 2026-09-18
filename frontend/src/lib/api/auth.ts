import { apiRequest, tokenStorage } from "@/lib/api/client";
import type { LoginInput, RegisterInput } from "@/lib/schemas";
import type { AuthTokens, User } from "@/lib/types";

export async function login(credentials: LoginInput): Promise<User> {
  const tokens = await apiRequest<AuthTokens>("/auth/token/", {
    method: "POST",
    body: credentials,
    auth: false,
  });
  tokenStorage.save(tokens);
  return getCurrentUser();
}

export async function register(input: RegisterInput): Promise<void> {
  await apiRequest<User>("/auth/register/", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/accounts/me/");
}

export function logout(): void {
  tokenStorage.clear();
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useAuth } from "@/lib/auth-context";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      await signIn(values);
      router.replace("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Usuário ou senha incorretos.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-ink">Entrar</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label="Usuário"
          autoComplete="username"
          error={errors.username?.message}
          {...register("username")}
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {formError && <Alert tone="error">{formError}</Alert>}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Entrar
        </Button>
      </form>

      <p className="text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}

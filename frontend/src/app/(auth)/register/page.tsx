"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { register as registerUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { registerSchema, type RegisterInput } from "@/lib/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      await registerUser(values);
      await signIn({ username: values.username, password: values.password });
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          if (field in values) {
            setError(field as keyof RegisterInput, { message: messages[0] });
          }
        });
        setFormError(error.message);
        return;
      }
      setFormError("Não foi possível criar a conta. Tente de novo.");
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-ink">Criar conta</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label="Usuário"
          autoComplete="username"
          error={errors.username?.message}
          {...register("username")}
        />
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Field
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          error={errors.password_confirm?.message}
          {...register("password_confirm")}
        />

        {formError && <Alert tone="error">{formError}</Alert>}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Criar conta
        </Button>
      </form>

      <p className="text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

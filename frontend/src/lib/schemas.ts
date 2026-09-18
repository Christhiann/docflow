import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Informe seu usuário"),
  password: z.string().min(1, "Informe sua senha"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Use pelo menos 3 caracteres")
      .max(150, "Máximo de 150 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Use pelo menos 8 caracteres"),
    password_confirm: z.string().min(8, "Repita a senha"),
  })
  .refine((data) => data.password === data.password_confirm, {
    path: ["password_confirm"],
    message: "As senhas não conferem",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const MAX_UPLOAD_SIZE_MB = 10;
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "txt",
  "md",
  "csv",
  "docx",
  "xlsx",
  "png",
  "jpg",
  "jpeg",
];

/** Validação de upload no cliente — o backend valida de novo, isto é só UX. */
export function validateUpload(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Formato .${extension} não aceito. Use: ${ALLOWED_EXTENSIONS.join(", ")}.`;
  }
  if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
    return `O arquivo passa de ${MAX_UPLOAD_SIZE_MB} MB.`;
  }
  if (file.size === 0) {
    return "O arquivo está vazio.";
  }
  return null;
}

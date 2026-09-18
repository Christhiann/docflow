export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <p className="text-lg font-semibold tracking-tight text-ink">DocFlow</p>
          <p className="text-sm text-muted">
            Envie documentos e acompanhe o processamento em tempo real.
          </p>
        </div>
        <div className="rounded border border-line bg-white p-6">{children}</div>
      </div>
    </main>
  );
}

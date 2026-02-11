import { Leaf } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4">
      {/* Subtle green gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-500">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            FarmCore
          </h1>
        </div>

        {children}
      </div>
    </div>
  )
}

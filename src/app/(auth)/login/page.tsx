import Link from "next/link"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <header className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Sign in to llmbench.dev
          </h1>
          <p className="text-sm text-muted-foreground">
            Use your existing account from GitHub, Google, or Discord.
          </p>
        </header>
        <div className="space-y-3">
          <OAuthButton provider="github" label="Continue with GitHub" />
          <OAuthButton provider="google" label="Continue with Google" />
          <OAuthButton provider="discord" label="Continue with Discord" />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to the{" "}
          <Link href="#" className="underline underline-offset-4">
            terms of use
          </Link>
          .
        </p>
      </div>
    </main>
  )
}

interface OAuthButtonProps {
  provider: "github" | "google" | "discord"
  label: string
}

function OAuthButton({ provider, label }: OAuthButtonProps) {
  const href = `/api/auth/sign-in/${provider}`

  return (
    <a
      href={href}
      className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
    >
      {label}
    </a>
  )
}


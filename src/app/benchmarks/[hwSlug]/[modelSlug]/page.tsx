import type { Metadata } from "next"

export const revalidate = 3600

interface CanonicalPageProps {
  params: Promise<{
    hwSlug: string
    modelSlug: string
  }>
}

export async function generateMetadata(
  props: CanonicalPageProps,
): Promise<Metadata> {
  const { hwSlug, modelSlug } = await props.params
  const title = `${hwSlug} + ${modelSlug} — llmbench.dev`

  return {
    title,
    description:
      "Community-submitted LLM inference benchmarks for this hardware and model combination.",
  }
}

export default async function CanonicalBenchmarkPage(
  props: CanonicalPageProps,
) {
  const { hwSlug, modelSlug } = await props.params

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {hwSlug} / {modelSlug}
        </h1>
        <p className="text-sm text-muted-foreground">
          SEO canonical page placeholder for this hardware + model
          combination. A richer summary and chart view can be added on top of
          existing queries.
        </p>
      </header>
    </main>
  )
}


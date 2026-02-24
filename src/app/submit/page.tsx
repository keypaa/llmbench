"use client"

import { useState } from "react"

import type { BenchmarkSubmitInput } from "@/lib/validators/benchmarks"

const initialForm: BenchmarkSubmitInput = {
  hardwareId: "",
  modelId: "",
  quantization: "",
  engine: "",
  tokensPerSecond: 0,
  os: "",
}

type Step = 1 | 2 | 3

export default function SubmitPage() {
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [form, setForm] = useState<BenchmarkSubmitInput>(initialForm)

  function update<K extends keyof BenchmarkSubmitInput>(
    key: K,
    value: BenchmarkSubmitInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/benchmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setError(body?.error ?? "Failed to submit benchmark.")
        return
      }

      setSuccessMessage("Benchmark submitted. It will appear once verified.")
      setForm(initialForm)
      setStep(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Submit a benchmark
        </h1>
        <p className="text-sm text-muted-foreground">
          A minimal multi-step form. More guided UI can be added later.
        </p>
      </header>

      <div className="flex gap-2 text-xs font-medium">
        <StepBadge label="Hardware & model" current={step} step={1} />
        <StepBadge label="Engine & config" current={step} step={2} />
        <StepBadge label="Results" current={step} step={3} />
      </div>

      <section className="space-y-4 rounded-md border bg-card p-4 text-sm">
        {step === 1 && (
          <div className="space-y-3">
            <Field
              label="Hardware ID (UUID)"
              value={form.hardwareId}
              onChange={(value) => update("hardwareId", value)}
            />
            <Field
              label="System RAM (GB)"
              type="number"
              value={form.systemRamGb?.toString() ?? ""}
              onChange={(value) =>
                update("systemRamGb", value ? Number(value) : undefined)
              }
            />
            <Field
              label="Model ID (UUID)"
              value={form.modelId}
              onChange={(value) => update("modelId", value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Field
              label="Quantization (e.g. Q4_K_M)"
              value={form.quantization}
              onChange={(value) => update("quantization", value)}
            />
            <Field
              label="Engine (e.g. llama.cpp)"
              value={form.engine}
              onChange={(value) => update("engine", value)}
            />
            <Field
              label="Engine version"
              value={form.engineVersion ?? ""}
              onChange={(value) =>
                update("engineVersion", value ? value : undefined)
              }
            />
            <Field
              label="OS"
              placeholder="Windows / Linux / macOS"
              value={form.os}
              onChange={(value) => update("os", value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Field
              label="Tokens per second"
              type="number"
              value={form.tokensPerSecond.toString()}
              onChange={(value) =>
                update("tokensPerSecond", Number(value || "0"))
              }
            />
            <Field
              label="Prompt tokens per second"
              type="number"
              value={form.promptTokensPerSecond?.toString() ?? ""}
              onChange={(value) =>
                update(
                  "promptTokensPerSecond",
                  value ? Number(value) : undefined,
                )
              }
            />
            <Field
              label="TTFT (ms)"
              type="number"
              value={form.timeToFirstTokenMs?.toString() ?? ""}
              onChange={(value) =>
                update(
                  "timeToFirstTokenMs",
                  value ? Number(value) : undefined,
                )
              }
            />
            <Field
              label="Context size"
              type="number"
              value={form.contextSize?.toString() ?? ""}
              onChange={(value) =>
                update("contextSize", value ? Number(value) : undefined)
              }
            />
            <Field
              label="Notes"
              as="textarea"
              value={form.notes ?? ""}
              onChange={(value) => update("notes", value || undefined)}
            />
          </div>
        )}
      </section>

      {error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {successMessage}
        </p>
      )}

      <footer className="mt-auto flex justify-between gap-4">
        <button
          type="button"
          className="inline-flex min-w-[96px] items-center justify-center rounded-md border px-3 py-2 text-xs font-medium"
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
          disabled={step === 1 || isSubmitting}
        >
          Back
        </button>
        <button
          type="button"
          className="inline-flex min-w-[120px] items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
          onClick={() => (step === 3 ? handleSubmit() : setStep((s) => ((s + 1) as Step)))}
          disabled={isSubmitting}
        >
          {step === 3 ? (isSubmitting ? "Submitting..." : "Submit benchmark") : "Next"}
        </button>
      </footer>
    </main>
  )
}

interface StepBadgeProps {
  label: string
  current: Step
  step: Step
}

function StepBadge({ label, current, step }: StepBadgeProps) {
  const isActive = current === step

  return (
    <div
      className={`flex flex-1 items-center justify-center rounded-md border px-2 py-1 ${
        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      <span className="mr-1 text-[10px]">{step}</span>
      <span>{label}</span>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "number"
  as?: "input" | "textarea"
  placeholder?: string
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  as = "input",
  placeholder,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      {as === "textarea" ? (
        <textarea
          className="min-h-[80px] rounded-md border bg-background px-2 py-1 text-xs outline-none ring-0 focus-visible:ring-1 focus-visible:ring-ring"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="rounded-md border bg-background px-2 py-1 text-xs outline-none ring-0 focus-visible:ring-1 focus-visible:ring-ring"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}


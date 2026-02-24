import { z } from "zod"

export const benchmarkSubmitSchema = z.object({
  hardwareId: z.string().uuid(),
  systemRamGb: z.number().int().positive().max(2048).optional(),
  modelId: z.string().uuid(),
  quantization: z.string().min(1),
  engine: z.string().min(1),
  engineVersion: z.string().min(1).optional(),
  engineParams: z.record(z.unknown()).optional(),
  tokensPerSecond: z.number().positive().max(100000),
  promptTokensPerSecond: z.number().positive().max(100000).optional(),
  timeToFirstTokenMs: z.number().positive().max(600000).optional(),
  parallelRequests: z.number().int().positive().max(1024).optional(),
  contextSize: z.number().int().positive().max(1048576).optional(),
  os: z.string().min(1),
  driverVersion: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
})

export type BenchmarkSubmitInput = z.infer<typeof benchmarkSubmitSchema>

export const llamaBenchImportSchema = z.object({
  model: z.string().min(1),
  n_gpu_layers: z.number().int().nonnegative().optional(),
  n_threads: z.number().int().positive().optional(),
  n_prompt: z.number().int().positive().optional(),
  n_gen: z.number().int().positive().optional(),
  test: z.string().min(1).optional(),
  avg_ts: z.number().positive(),
  t_pp_ms: z.number().positive().optional(),
})

export type LlamaBenchImportInput = z.infer<typeof llamaBenchImportSchema>

